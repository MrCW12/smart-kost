import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

function EmptyState({ title = "Tidak ada data", description, icon: Icon = AlertCircle }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}

export { EmptyState }
