import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

function Spinner({ className }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
}

function LoadingPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export { Spinner, LoadingPage }
