import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { Construction } from "lucide-react"

export default function ComingSoon({ title }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <EmptyState
          title={`${title} - Coming Soon`}
          description="Halaman ini sedang dalam pengembangan"
          icon={Construction}
        />
      </CardContent>
    </Card>
  )
}
