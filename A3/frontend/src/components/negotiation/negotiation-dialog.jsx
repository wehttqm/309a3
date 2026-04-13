import { useEffect, useMemo, useRef, useState } from "react"
import { useSocket } from "@/context/socket-context"
import { apiClient, requestJson } from "@/lib/api/client"
import { getUserDisplayName } from "@/lib/user-status"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/loading-state"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function formatTimeRemaining(expiresAt) {
  if (!expiresAt) return "—"
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return "Expired"

  const totalSeconds = Math.floor(diff / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function ParticipantCard({ label, user, decision }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} className="h-12 w-12" fallbackClassName="text-sm" showStatus={false} />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate font-medium">{getUserDisplayName(user)}</p>
          <p className="text-sm text-muted-foreground">Decision: {decision || "pending"}</p>
        </div>
      </div>
    </div>
  )
}

function HistoryItem({ item }) {
  const candidateName = `${item.user?.first_name || ""} ${item.user?.last_name || ""}`.trim() || "Candidate"
  const businessName = item.job?.business?.business_name || "Business"

  return (
    <div className="rounded-2xl border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{item.job?.position_type?.name || `Negotiation #${item.id}`}</p>
          <p className="text-xs text-muted-foreground">{businessName} · {candidateName}</p>
        </div>
        <span className="rounded-full border px-2 py-1 text-xs font-medium capitalize">{item.status}</span>
      </div>
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
        <p>Updated {new Date(item.updatedAt || item.createdAt).toLocaleString()}</p>
        <p>
          Decisions: candidate {item.decisions?.candidate || "pending"} · business {item.decisions?.business || "pending"}
        </p>
      </div>
    </div>
  )
}

export function NegotiationDialog() {
  const {
    socket,
    isNegotiationOpen,
    closeNegotiation,
    refreshNegotiationState,
  } = useSocket()
  const [negotiation, setNegotiation] = useState(null)
  const [history, setHistory] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState("—")
  const [completionMessage, setCompletionMessage] = useState("")
  const [presenceState, setPresenceState] = useState({ count: 0, both_present: false, participants: [] })
  const skipLeaveRef = useRef(false)

  const loadNegotiation = async () => {
    setLoading(true)
    setError("")
    setCompletionMessage("")
    setMessages([])
    try {
      const data = await requestJson("/negotiations")
      setNegotiation(data?.current || null)
      setHistory(data?.history || [])
      setTimeRemaining(formatTimeRemaining(data?.current?.expiresAt))
      await refreshNegotiationState()
    } catch (err) {
      setNegotiation(null)
      setHistory([])
      setMessages([])
      setPresenceState({ count: 0, both_present: false, participants: [] })
      setError(err.message || "No active negotiation found.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isNegotiationOpen) return
    loadNegotiation()
  }, [isNegotiationOpen])

  useEffect(() => {
    if (!isNegotiationOpen || !negotiation?.expiresAt) return undefined

    setTimeRemaining(formatTimeRemaining(negotiation.expiresAt))
    const intervalId = window.setInterval(() => {
      setTimeRemaining(formatTimeRemaining(negotiation.expiresAt))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [isNegotiationOpen, negotiation?.expiresAt])

  useEffect(() => {
    if (!socket || !isNegotiationOpen) return undefined

    const onMessage = (payload) => {
      setMessages((current) => [...current, payload])
    }

    const onSystem = (payload) => {
      setMessages((current) => [...current, { ...payload, system: true }])
    }

    const onError = (payload) => {
      setError(payload?.message || payload?.error || "Negotiation error.")
    }

    const onPresenceState = (payload) => {
      setPresenceState({
        count: Number(payload?.count || 0),
        both_present: Boolean(payload?.both_present),
        participants: Array.isArray(payload?.participants) ? payload.participants : [],
      })
    }

    const onStarted = () => {
      loadNegotiation()
    }

    const onDecision = (payload) => {
      setNegotiation((current) => {
        if (!current || current.id !== payload?.negotiation_id) return current
        return {
          ...current,
          status: payload?.status || current.status,
          updatedAt: payload?.updatedAt || current.updatedAt,
          decisions: payload?.decisions || current.decisions,
        }
      })
      refreshNegotiationState()
    }

    const onCompleted = (payload) => {
      setNegotiation((current) => {
        if (!current || current.id !== payload?.negotiation_id) return current
        return {
          ...current,
          status: payload?.status || "success",
          updatedAt: payload?.updatedAt || current.updatedAt,
          decisions: payload?.decisions || current.decisions,
        }
      })
      setMessages((current) => [
        ...current,
        {
          system: true,
          type: "completion",
          createdAt: new Date().toISOString(),
          text: payload?.message || "Congratulations — both parties accepted. The shift is now confirmed.",
        },
      ])
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:job-updated-from-negotiation"))
      }
      skipLeaveRef.current = true
      setCompletionMessage(payload?.message || "Congratulations — both parties accepted. The shift is now confirmed.")
      refreshNegotiationState()
    }

    socket.on("negotiation:message", onMessage)
    socket.on("negotiation:system", onSystem)
    socket.on("negotiation:error", onError)
    socket.on("negotiation:presence_state", onPresenceState)
    socket.on("negotiation:started", onStarted)
    socket.on("negotiation:decision", onDecision)
    socket.on("negotiation:completed", onCompleted)

    return () => {
      socket.off("negotiation:message", onMessage)
      socket.off("negotiation:system", onSystem)
      socket.off("negotiation:error", onError)
      socket.off("negotiation:presence_state", onPresenceState)
      socket.off("negotiation:started", onStarted)
      socket.off("negotiation:decision", onDecision)
      socket.off("negotiation:completed", onCompleted)
    }
  }, [socket, isNegotiationOpen, refreshNegotiationState])

  useEffect(() => {
    if (!socket || !isNegotiationOpen || !negotiation?.id) return undefined

    socket.emit("negotiation:presence", {
      negotiation_id: negotiation.id,
      action: "join",
    })

    return () => {
      if (skipLeaveRef.current) {
        skipLeaveRef.current = false
        return
      }

      socket.emit("negotiation:presence", {
        negotiation_id: negotiation.id,
        action: "leave",
      })
    }
  }, [socket, isNegotiationOpen, negotiation?.id])

  useEffect(() => {
    if (!completionMessage) return undefined

    const timer = window.setTimeout(() => {
      setCompletionMessage("")
      closeNegotiation()
      setNegotiation(null)
      setMessages([])
      loadNegotiation()
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [completionMessage, closeNegotiation])

  const participantMeta = useMemo(() => {
    if (!negotiation) return { candidate: null, business: null }

    return {
      candidate: {
        ...negotiation.user,
        role: "regular",
        name: `${negotiation.user.first_name || ""} ${negotiation.user.last_name || ""}`.trim(),
      },
      business: {
        ...negotiation.job.business,
        role: "business",
        name: negotiation.job.business.business_name,
      },
    }
  }, [negotiation])

  const sendMessage = () => {
    if (!socket || !negotiation || !text.trim()) return
    socket.emit("negotiation:message", {
      negotiation_id: negotiation.id,
      text: text.trim(),
    })
    setText("")
  }

  const submitDecision = async (decision) => {
    if (!negotiation) return
    setDecisionLoading(true)
    setError("")
    try {
      const next = await apiClient.patchNegotiationsMeDecision({
        body: {
          negotiation_id: negotiation.id,
          decision,
        },
      })
      setNegotiation((current) => ({
        ...current,
        ...next,
        decisions: next.decisions || current?.decisions,
      }))

      if (next?.status === "success") {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("app:job-updated-from-negotiation"))
        }
        skipLeaveRef.current = true
        setCompletionMessage("Congratulations — both parties accepted. The shift is now confirmed.")
      }
      refreshNegotiationState()
    } catch (err) {
      setError(err.message || "Failed to update negotiation decision.")
    } finally {
      setDecisionLoading(false)
    }
  }


  const otherPartyPresent = useMemo(() => {
    if (!negotiation) return false
    if (presenceState?.both_present) return true
    const roles = new Set(presenceState.participants.map((participant) => participant?.role).filter(Boolean))
    return roles.has("regular") && roles.has("business")
  }, [negotiation, presenceState?.both_present, presenceState.participants])

  const canSendMessages = Boolean(negotiation) && !completionMessage && negotiation?.status !== "success" && otherPartyPresent

  const getMessageAuthor = (message) => {
    if (!negotiation) return null
    if (message?.sender?.role === "business") {
      return participantMeta.business
    }
    return participantMeta.candidate
  }

  return (
    <Dialog open={isNegotiationOpen} onOpenChange={(open) => !open && closeNegotiation()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Negotiation</DialogTitle>
          <DialogDescription>
            Review the current negotiation window, exchange messages, and accept or decline the offer.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <LoadingState title="Loading negotiation" description="Connecting the live window, presence state, messages, and decision history." compact />
        ) : null}

        {!loading && !negotiation && history.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-sm text-muted-foreground">
              No active negotiation found.
            </CardContent>
          </Card>
        ) : null}

        {!loading && negotiation ? (
          <div className="stagger-enter grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <ParticipantCard
                    label="Candidate"
                    user={participantMeta.candidate}
                    decision={negotiation.decisions?.candidate}
                  />
                  <ParticipantCard
                    label="Business"
                    user={participantMeta.business}
                    decision={negotiation.decisions?.business}
                  />
                </div>

                <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-2xl border p-4">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  ) : (
                    messages.map((message, index) => {
                      if (message?.system || message?.type === "presence" || message?.type === "completion") {
                        const actorLabel =
                          message?.sender?.role === "business"
                            ? participantMeta.business?.name || "Business"
                            : participantMeta.candidate?.name || "Candidate"
                        const systemText =
                          message?.text ||
                          (message?.action === "join"
                            ? `${actorLabel} opened the negotiation window.`
                            : `${actorLabel} left the negotiation window.`)

                        return (
                          <div key={`${message.createdAt}-${index}`} className="rounded-2xl border border-dashed bg-muted/20 px-3 py-2 text-center text-sm text-muted-foreground">
                            <p>{systemText}</p>
                            <p className="mt-1 text-xs">{new Date(message.createdAt).toLocaleString()}</p>
                          </div>
                        )
                      }

                      const author = getMessageAuthor(message)
                      return (
                        <div key={`${message.createdAt}-${index}`} className="rounded-2xl border bg-muted/30 p-3">
                          <div className="mb-2 flex items-center gap-3">
                            <UserAvatar user={author} className="h-8 w-8" fallbackClassName="text-xs" showStatus={false} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{getUserDisplayName(author)}</p>
                              <p className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-sm">{message.text}</p>
                        </div>
                      )
                    })
                  )}
                </div>

                {!completionMessage && negotiation?.status === "active" && !otherPartyPresent ? (
                  <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-medium">Waiting for the other party</p>
                    <p className="mt-1 text-amber-800">They have not joined the negotiation window yet. Messaging is disabled until both parties are present.</p>
                  </div>
                ) : null}

                {completionMessage ? (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                    <p className="font-medium">Congratulations</p>
                    <p className="mt-1 text-muted-foreground">{completionMessage}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Closing this window…</p>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Type a negotiation message"
                    disabled={!canSendMessages}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button disabled={!canSendMessages} onClick={sendMessage}>Send</Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Offer details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="font-medium">{negotiation.job.position_type.name}</p>
                    <p className="mt-1 text-muted-foreground">Negotiation #{negotiation.id}</p>
                  </div>

                  <div className="grid gap-2 rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Business</span>
                      <span className="text-right font-medium">{participantMeta.business.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Candidate</span>
                      <span className="text-right font-medium">{participantMeta.candidate.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Window ends</span>
                      <span className="text-right font-medium">{new Date(negotiation.expiresAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Time remaining</span>
                      <span className="text-right font-medium">{timeRemaining}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Shift</span>
                      <span className="text-right font-medium">
                        {new Date(negotiation.job.start_time).toLocaleString()} — {new Date(negotiation.job.end_time).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Pay</span>
                      <span className="text-right font-medium">
                        ${negotiation.job.salary_min} — ${negotiation.job.salary_max}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-right font-medium capitalize">{negotiation.status}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={decisionLoading || Boolean(completionMessage) || negotiation?.status === "success"} onClick={() => submitDecision("accept")}>
                      Accept
                    </Button>
                    <Button className="flex-1" variant="destructive" disabled={decisionLoading || Boolean(completionMessage) || negotiation?.status === "success"} onClick={() => submitDecision("decline")}>
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Negotiation History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No historic negotiations yet.</p>
                  ) : (
                    history.slice(0, 8).map((item) => <HistoryItem key={item.id} item={item} />)
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {!loading && !negotiation && history.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Negotiation History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.slice(0, 10).map((item) => <HistoryItem key={item.id} item={item} />)}
            </CardContent>
          </Card>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
