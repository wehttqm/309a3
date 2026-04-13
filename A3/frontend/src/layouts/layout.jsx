import Navbar from "@/components/navbar"
import { NegotiationDialog } from "@/components/negotiation/negotiation-dialog"
import { OpenNegotiationDialog } from "@/components/negotiation/open-negotiation-dialog"
import { useSocket } from "@/context/socket-context"
import { Outlet } from "react-router-dom"

export default function Layout() {
  const {
    isNegotiationPromptOpen,
    negotiationPreview,
    isNegotiationPreviewLoading,
    closeNegotiationPrompt,
    confirmOpenNegotiation,
  } = useSocket()

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <OpenNegotiationDialog
        open={isNegotiationPromptOpen}
        onOpenChange={(open) => {
          if (!open) closeNegotiationPrompt()
        }}
        negotiation={negotiationPreview}
        isLoading={isNegotiationPreviewLoading}
        onConfirm={confirmOpenNegotiation}
      />
      <NegotiationDialog />
      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        CSC309 Winter 2026 - Assignment 3
      </footer>
    </div>
  )
}
