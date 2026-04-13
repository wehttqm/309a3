"use strict";

const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { prisma } = require("./utils/prisma_client");
const { set_io } = require("./utils/socket_state");
const { expireNegotiationIfNeeded, findCurrentActiveNegotiation } = require("./utils/negotiations");

const dialogPresence = new Map();

function emitNegotiationError(socket, error, message) {
  socket.emit("negotiation:error", { error, message });
}

function emitNegotiationPresence(io, negotiationId, payload, exceptSocketId = null) {
  const room = `negotiation:${negotiationId}`;
  if (exceptSocketId) {
    io.to(room).except(exceptSocketId).emit("negotiation:system", payload);
    return;
  }
  io.to(room).emit("negotiation:system", payload);
}

function getPresenceState(negotiationId) {
  const entries = Array.from(dialogPresence.get(negotiationId)?.values() || []);
  const uniqueParties = new Map();

  for (const entry of entries) {
    if (!entry || entry.userId == null) {
      continue;
    }
    const key = `${entry.role}:${entry.userId}`;
    if (!uniqueParties.has(key)) {
      uniqueParties.set(key, {
        id: entry.userId,
        role: entry.role,
        joinedAt: entry.joinedAt,
      });
    }
  }

  const participants = Array.from(uniqueParties.values());
  const roles = new Set(participants.map((participant) => participant.role).filter(Boolean));

  return {
    negotiation_id: negotiationId,
    count: entries.length,
    socket_count: entries.length,
    participant_count: participants.length,
    both_present: roles.has("regular") && roles.has("business"),
    participants,
  };
}

function emitPresenceState(io, negotiationId, targetSocket = null) {
  const payload = getPresenceState(negotiationId);
  if (targetSocket) {
    targetSocket.emit("negotiation:presence_state", payload);
    return;
  }
  io.to(`negotiation:${negotiationId}`).emit("negotiation:presence_state", payload);
}

function upsertDialogPresence(socket, negotiationId) {
  const current = dialogPresence.get(negotiationId) || new Map();
  current.set(socket.id, {
    socketId: socket.id,
    userId: socket.userId,
    role: socket.role,
    joinedAt: new Date().toISOString(),
  });
  dialogPresence.set(negotiationId, current);
}

function removeDialogPresence(socket, negotiationId) {
  const current = dialogPresence.get(negotiationId);
  if (!current) return;
  current.delete(socket.id);
  if (current.size === 0) {
    dialogPresence.delete(negotiationId);
    return;
  }
  dialogPresence.set(negotiationId, current);
}

async function joinActiveNegotiationRoom(socket) {
  const role = socket.role;
  if (role !== "regular" && role !== "business") return;

  const negotiation = await findCurrentActiveNegotiation(
    role === "regular" ? { userId: socket.userId } : { job: { businessId: socket.userId } },
    new Date(),
  );

  if (negotiation) {
    socket.join(`negotiation:${negotiation.id}`);
  }
}

async function handleNegotiationPresence(socket, payload) {
  try {
    if (!socket.userId) {
      return;
    }

    const negotiationId = payload?.negotiation_id;
    const action = payload?.action;

    if (typeof negotiationId !== "number" || !["join", "leave"].includes(action)) {
      return;
    }

    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { job: { select: { businessId: true } } },
    });

    if (!negotiation) {
      return;
    }

    if (negotiation.status !== "active") {
      return;
    }

    if (await expireNegotiationIfNeeded(negotiation, new Date())) {
      return;
    }

    const isParty = negotiation.userId === socket.userId || negotiation.job.businessId === socket.userId;
    if (!isParty) {
      return;
    }

    socket.data = socket.data || {};

    if (action === "join") {
      const previousNegotiationId = socket.data.activeNegotiationDialogId;
      if (previousNegotiationId && previousNegotiationId !== negotiationId) {
        emitNegotiationPresence(socket.nsp, previousNegotiationId, {
          negotiation_id: previousNegotiationId,
          type: "presence",
          action: "leave",
          sender: { role: socket.role, id: socket.userId },
          createdAt: new Date().toISOString(),
        }, socket.id);
        removeDialogPresence(socket, previousNegotiationId);
        socket.leave(`negotiation:${previousNegotiationId}`);
        emitPresenceState(socket.nsp, previousNegotiationId);
      }

      socket.join(`negotiation:${negotiationId}`);
      socket.data.activeNegotiationDialogId = negotiationId;
      upsertDialogPresence(socket, negotiationId);
    }

    if (action === "leave" && socket.data.activeNegotiationDialogId !== negotiationId) {
      return;
    }

    const payloadOut = {
      negotiation_id: negotiationId,
      type: "presence",
      action,
      sender: { role: socket.role, id: socket.userId },
      createdAt: new Date().toISOString(),
    };

    if (action === "leave") {
      emitNegotiationPresence(socket.nsp, negotiationId, payloadOut, socket.id);
      removeDialogPresence(socket, negotiationId);
      socket.leave(`negotiation:${negotiationId}`);
      socket.data.activeNegotiationDialogId = null;
    }

    emitPresenceState(socket.nsp, negotiationId);
    if (action === "join") {
      emitPresenceState(socket.nsp, negotiationId, socket);
    }
  } catch (error) {
    console.error("socket negotiation:presence error:", error);
  }
}

async function handleNegotiationMessage(socket, payload) {
  try {
    if (!socket.userId) {
      emitNegotiationError(socket, "Not authenticated", "Authentication is required.");
      return;
    }

    const negotiationId = payload?.negotiation_id;
    const text = typeof payload?.text === "string" ? payload.text.trim() : "";

    if (typeof negotiationId !== "number" || !text) {
      emitNegotiationError(socket, "Negotiation not found (or not active)", "Invalid negotiation payload.");
      return;
    }

    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { job: { select: { businessId: true } } },
    });

    if (!negotiation || negotiation.status !== "active") {
      emitNegotiationError(socket, "Negotiation not found (or not active)", "Negotiation not found or not active.");
      return;
    }

    if (await expireNegotiationIfNeeded(negotiation, new Date())) {
      emitNegotiationError(socket, "Negotiation not found (or not active)", "Negotiation not found or not active.");
      return;
    }

    const isParty = negotiation.userId === socket.userId || negotiation.job.businessId === socket.userId;
    if (!isParty) {
      emitNegotiationError(socket, "Not part of this negotiation", "You are not part of this negotiation.");
      return;
    }

    const activeNegotiation = await findCurrentActiveNegotiation(
      socket.role === "regular" ? { userId: socket.userId } : { job: { businessId: socket.userId } },
      new Date(),
    );

    if (!activeNegotiation) {
      emitNegotiationError(socket, "Negotiation not found (or not active)", "No active negotiation found.");
      return;
    }

    if (activeNegotiation.id !== negotiationId) {
      emitNegotiationError(socket, "Negotiation mismatch", "This is not your current active negotiation.");
      return;
    }

    const state = getPresenceState(negotiationId);
    if (!state.both_present) {
      emitNegotiationError(socket, "Waiting for the other party", "Wait for the other party to join before sending messages.");
      return;
    }

    const message = {
      negotiation_id: negotiationId,
      sender: { role: socket.role, id: socket.userId },
      text,
      createdAt: new Date().toISOString(),
    };

    socket.join(`negotiation:${negotiationId}`);
    socket.to(`negotiation:${negotiationId}`).emit("negotiation:message", message);
    socket.emit("negotiation:message", message);
  } catch (error) {
    console.error("socket negotiation:message error:", error);
    emitNegotiationError(socket, "Negotiation not found (or not active)", "Unable to process negotiation message.");
  }
}

function attach_sockets(server) {
  const io = new Server(server, { cors: { origin: "*" } });
  set_io(io);

  io.on("connection", async (socket) => {
    try {
      const token = socket.handshake?.auth?.token;
      if (!token) {
        socket.disconnect(true);
        return;
      }

      const decoded = jwt.verify(token, "secret");
      socket.userId = decoded.id;
      socket.role = decoded.role;
      socket.join(`account:${decoded.id}`);
      await joinActiveNegotiationRoom(socket);
    } catch (error) {
      socket.disconnect(true);
      return;
    }

    socket.on("negotiation:message", (payload) => {
      handleNegotiationMessage(socket, payload);
    });

    socket.on("negotiation:presence", (payload) => {
      handleNegotiationPresence(socket, payload);
    });

    socket.on("disconnecting", () => {
      const negotiationId = socket.data?.activeNegotiationDialogId;
      if (!negotiationId) {
        return;
      }

      emitNegotiationPresence(
        socket.nsp,
        negotiationId,
        {
          negotiation_id: negotiationId,
          type: "presence",
          action: "leave",
          sender: { role: socket.role, id: socket.userId },
          createdAt: new Date().toISOString(),
        },
        socket.id,
      );
      removeDialogPresence(socket, negotiationId);
      emitPresenceState(socket.nsp, negotiationId);
      socket.data.activeNegotiationDialogId = null;
    });
  });

  return io;
}

module.exports = { attach_sockets };
