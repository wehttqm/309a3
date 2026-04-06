import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"
import { useSocket } from "@/context/socket-context"
import { useAuth } from "@/context/auth-context"

export function NegotiationPage() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [negotiation, setNegotiation] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [decisionLoading, setDecisionLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await apiClient.getNegotiationsMe()
        if (mounted) setNegotiation(data)
      } catch (err) {
        if (mounted) setError(err.message || "No active negotiation found.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!socket) return
    const onMessage = (payload) => {
      setMessages((current) => [...current, payload])
    }
    const onError = (payload) => {
      setError(payload?.message || payload?.error || "Negotiation error.")
    }
    const onStarted = (payload) => {
      if (payload?.negotiation_id) {
        apiClient.getNegotiationsMe().then(setNegotiation).catch(() => {})
      }
    }

    socket.on("negotiation:message", onMessage)
    socket.on("negotiation:error", onError)
    socket.on("negotiation:started", onStarted)

    return () => {
      socket.off("negotiation:message", onMessage)
      socket.off("negotiation:error", onError)
      socket.off("negotiation:started", onStarted)
    }
  }, [socket])

  const partner = useMemo(() => {
    if (!negotiation) return null
    if (user?.role === "business") return `${negotiation.user.first_name} ${negotiation.user.last_name}`
    return negotiation.job.business.business_name
  }, [negotiation, user?.role])

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
      setNegotiation((current) => ({ ...current, ...next, decisions: next.decisions || current?.decisions }))
    } catch (err) {
      setError(err.message || "Failed to update negotiation decision.")
    } finally {
      setDecisionLoading(false)
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground">Loading negotiation...</div>
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Negotiation</h1>
      </div>

      {error ? <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      {!negotiation ? (
        <Card><CardContent className="py-8 text-sm text-muted-foreground">No active negotiation found.</CardContent></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader><CardTitle>Chat</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-md border p-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                ) : messages.map((message, index) => (
                  <div key={`${message.createdAt}-${index}`} className="rounded-md bg-muted p-3 text-sm">
                    <div className="mb-1 font-medium">{message.sender.role} #{message.sender.id}</div>
                    <div>{message.text}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Type a negotiation message" />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="font-medium">Negotiation #{negotiation.id}</div>
                <div className="text-muted-foreground">Partner: {partner}</div>
              </div>
              <div>
                <div>Job: {negotiation.job.position_type.name}</div>
                <div>Business: {negotiation.job.business.business_name}</div>
                <div>Window ends: {new Date(negotiation.expiresAt).toLocaleString()}</div>
              </div>
              <div>
                <div>Candidate decision: {negotiation.decisions?.candidate || "pending"}</div>
                <div>Business decision: {negotiation.decisions?.business || "pending"}</div>
                <div>Status: {negotiation.status}</div>
              </div>
              <div className="flex gap-2">
                <Button disabled={decisionLoading} onClick={() => submitDecision("accept")}>Accept</Button>
                <Button variant="destructive" disabled={decisionLoading} onClick={() => submitDecision("decline")}>Decline</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
