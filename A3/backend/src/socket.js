'use strict';

const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { prisma } = require('./utils/prisma_client');
const { set_io } = require('./utils/socket_state');

function emitNegotiationError(socket, error, message) {
  socket.emit('negotiation:error', { error, message });
}

async function joinActiveNegotiationRoom(socket) {
  const role = socket.role;
  if (role !== 'regular' && role !== 'business') return;

  const negotiation = await prisma.negotiation.findFirst({
    where: {
      status: 'active',
      ...(role === 'regular'
        ? { userId: socket.userId }
        : { job: { businessId: socket.userId } }),
    },
    select: { id: true, expiresAt: true },
  });

  if (negotiation && negotiation.expiresAt > new Date()) {
    socket.join(`negotiation:${negotiation.id}`);
  }
}

async function handleNegotiationMessage(socket, payload) {
  try {
    if (!socket.userId) {
      emitNegotiationError(socket, 'Not authenticated', 'Authentication is required.');
      return;
    }

    const negotiationId = payload?.negotiation_id;
    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

    if (typeof negotiationId !== 'number' || !text) {
      emitNegotiationError(socket, 'Negotiation not found (or not active)', 'Invalid negotiation payload.');
      return;
    }

    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { job: { select: { businessId: true } } },
    });

    if (!negotiation || negotiation.status !== 'active' || negotiation.expiresAt <= new Date()) {
      emitNegotiationError(socket, 'Negotiation not found (or not active)', 'Negotiation not found or not active.');
      return;
    }

    const isParty = negotiation.userId === socket.userId || negotiation.job.businessId === socket.userId;
    if (!isParty) {
      emitNegotiationError(socket, 'Not part of this negotiation', 'You are not part of this negotiation.');
      return;
    }

    const activeNegotiation = await prisma.negotiation.findFirst({
      where: {
        status: 'active',
        ...(socket.role === 'regular'
          ? { userId: socket.userId }
          : { job: { businessId: socket.userId } }),
      },
      select: { id: true, expiresAt: true },
    });

    if (!activeNegotiation || activeNegotiation.expiresAt <= new Date()) {
      emitNegotiationError(socket, 'Negotiation not found (or not active)', 'No active negotiation found.');
      return;
    }

    if (activeNegotiation.id !== negotiationId) {
      emitNegotiationError(socket, 'Negotiation mismatch', 'This is not your current active negotiation.');
      return;
    }

    const message = {
      negotiation_id: negotiationId,
      sender: { role: socket.role, id: socket.userId },
      text,
      createdAt: new Date().toISOString(),
    };

    socket.join(`negotiation:${negotiationId}`);
    socket.to(`negotiation:${negotiationId}`).emit('negotiation:message', message);
    socket.emit('negotiation:message', message);
  } catch (error) {
    console.error('socket negotiation:message error:', error);
    emitNegotiationError(socket, 'Negotiation not found (or not active)', 'Unable to process negotiation message.');
  }
}

function attach_sockets(server) {
  const io = new Server(server, { cors: { origin: '*' } });
  set_io(io);

  io.on('connection', async (socket) => {
    try {
      const token = socket.handshake?.auth?.token;
      if (!token) {
        socket.disconnect(true);
        return;
      }

      const decoded = jwt.verify(token, 'secret');
      socket.userId = decoded.id;
      socket.role = decoded.role;
      socket.join(`account:${decoded.id}`);
      await joinActiveNegotiationRoom(socket);
    } catch (error) {
      socket.disconnect(true);
      return;
    }

    socket.on('negotiation:message', (payload) => {
      handleNegotiationMessage(socket, payload);
    });
  });

  return io;
}

module.exports = { attach_sockets };
