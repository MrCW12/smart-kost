import { Badge } from "@/components/ui/badge"
import { ROOM_STATUS, INVOICE_STATUS, PAYMENT_STATUS, TENANT_STATUS, TASK_STATUS } from "@/lib/constants"

function StatusBadge({ type, status }) {
  const config = {
    room: ROOM_STATUS,
    invoice: INVOICE_STATUS,
    payment: PAYMENT_STATUS,
    tenant: TENANT_STATUS,
    task: TASK_STATUS,
  }

  const statusConfig = config[type]?.[status]
  if (!statusConfig) return <Badge>{status}</Badge>

  return (
    <Badge className={statusConfig.color} variant="outline">
      {statusConfig.label}
    </Badge>
  )
}

export { StatusBadge }
