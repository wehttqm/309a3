import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSocket } from "@/context/socket-context"

export function NotificationsPage() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAllRead, removeNotification, openNegotiation } = useSocket()

  const handleOpen = (item) => {
    if (item?.negotiation_id) {
      openNegotiation()
      return
    }

    navigate(item?.href || "/notifications")
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-2 text-muted-foreground">Unread: {unreadCount}</p>
        </div>
        <Button variant="outline" onClick={markAllRead}>Mark all read</Button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No notifications yet.
            </CardContent>
          </Card>
        ) : (
          notifications.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>{item.message}</p>
                <p className="text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => handleOpen(item)}>
                    {item.negotiation_id ? "Open negotiation" : "Open"}
                  </Button>
                  <Button variant="ghost" onClick={() => removeNotification(item.id)}>Dismiss</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
