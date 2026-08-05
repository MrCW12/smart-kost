import { useState } from "react"
import { useParams, useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cleaningApi } from "@/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingPage } from "@/components/shared/spinner"
import { StatusBadge } from "@/components/shared/status-badge"
import { TASK_STATUS, TASK_PRIORITY } from "@/lib/constants"
import { formatDateTime } from "@/lib/utils"
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Upload,
  Camera,
  Clock,
  User,
  Building,
  Hash,
  StickyNote,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"

const STATUS_FLOW = ["waiting", "in_progress", "done", "verified"]

const TYPE_LABELS = {
  cleaning: "Pembersihan",
  checkout: "Checkout",
  periodic: "Berkala",
  maintenance: "Maintenance",
  request: "Permintaan",
}

const PHOTO_TYPE_LABELS = {
  before: "Sebelum",
  during: "Saat Dikerjakan",
  after: "Sesudah",
}

export default function StaffTaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [photoForm, setPhotoForm] = useState({ type: "before", caption: "", file: null })
  const [previewUrl, setPreviewUrl] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ["cleaning-task", id],
    queryFn: () => cleaningApi.get(id).then((res) => res.data.data),
  })

  const statusMutation = useMutation({
    mutationFn: (newStatus) => cleaningApi.updateStatus(id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries(["cleaning-task", id])
      queryClient.invalidateQueries(["staff-tasks"])
    },
    onError: (err) => {
      alert(err?.response?.data?.message || "Gagal mengubah status")
    },
  })

  const photoMutation = useMutation({
    mutationFn: (formData) => cleaningApi.addPhoto(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(["cleaning-task", id])
      setPhotoForm({ type: "before", caption: "", file: null })
      setPreviewUrl(null)
    },
    onError: (err) => {
      alert(err?.response?.data?.message || "Gagal mengunggah foto")
    },
  })

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoForm((prev) => ({ ...prev, file }))
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handlePhotoUpload = () => {
    if (!photoForm.file) return
    const fd = new FormData()
    fd.append("photo", photoForm.file)
    fd.append("type", photoForm.type)
    if (photoForm.caption) fd.append("caption", photoForm.caption)
    photoMutation.mutate(fd)
  }

  const buildWaLink = () => {
    if (!data) return "#"
    const room = data.room?.number || "-"
    const prop = data.property?.name || "-"
    const type = TYPE_LABELS[data.type] || data.type
    const text = encodeURIComponent(
      `📋 *Tiket Task*\n\n` +
        `🏠 Kamar: ${room}\n` +
        `🏢 Properti: ${prop}\n` +
        `📝 Tipe: ${type}\n` +
        `📊 Status: ${TASK_STATUS[data.status]?.label || data.status}\n` +
        (data.notes ? `\n💬 Catatan:\n${data.notes}` : "")
    )
    return `https://wa.me/?text=${text}`
  }

  if (isLoading) return <LoadingPage />
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Tiket tidak ditemukan</h2>
        <Button variant="link" onClick={() => navigate("/staff/tasks")}>
          Kembali ke daftar tiket
        </Button>
      </div>
    )
  }

  const currentStep = STATUS_FLOW.indexOf(data.status)
  const canStart = data.status === "waiting"
  const canComplete = data.status === "in_progress"
  const showPhotoUpload = data.status === "in_progress" || data.status === "done"

  const photosByType = { before: [], during: [], after: [] }
  ;(data.photos || []).forEach((p) => {
    if (photosByType[p.type]) photosByType[p.type].push(p)
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/staff/tasks")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            Tiket Kamar {data.room?.number || "-"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.property?.name || "-"}
          </p>
        </div>
        <StatusBadge type="task" status={data.status} />
      </div>

      {/* Status Progress Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((step, i) => {
              const isCompleted = i <= currentStep
              const isCurrent = i === currentStep
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
                    >
                      {isCompleted && i < currentStep ? "✓" : i + 1}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {TASK_STATUS[step]?.label}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-18px] ${
                        i < currentStep ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4" /> Info Tiket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" /> Properti
                  </span>
                  <p className="font-medium mt-0.5">{data.property?.name || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" /> Kamar
                  </span>
                  <p className="font-medium mt-0.5">{data.room?.number || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipe</span>
                  <p className="font-medium mt-0.5">
                    <Badge variant="outline">{TYPE_LABELS[data.type] || data.type}</Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prioritas</span>
                  <p className="font-medium mt-0.5">
                    <Badge
                      variant="outline"
                      className={
                        data.priority === "urgent"
                          ? "bg-red-100 text-red-800"
                          : data.priority === "high"
                          ? "bg-orange-100 text-orange-800"
                          : ""
                      }
                    >
                      {TASK_PRIORITY[data.priority] || data.priority || "-"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Ditugaskan Ke
                  </span>
                  <p className="font-medium mt-0.5">{data.assigned_to || "Belum ditugaskan"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Grup</span>
                  <p className="font-medium mt-0.5">{data.group?.name || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {data.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4" /> Catatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Photos Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4" /> Foto
                {(data.photos?.length || 0) > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {data.photos.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {["before", "during", "after"].map((type) => {
                const typePhotos = photosByType[type]
                if (typePhotos.length === 0) return null
                return (
                  <div key={type}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {PHOTO_TYPE_LABELS[type]}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {typePhotos.map((photo) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border">
                          <img
                            src={photo.path}
                            alt={photo.caption || type}
                            className="w-full h-32 object-cover"
                          />
                          {photo.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {(!data.photos || data.photos.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada foto
                </p>
              )}

              {/* Upload Section */}
              {showPhotoUpload && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Unggah Foto</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Jenis Foto</Label>
                      <Select
                        value={photoForm.type}
                        onValueChange={(v) => setPhotoForm((prev) => ({ ...prev, type: v }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before">Sebelum</SelectItem>
                          <SelectItem value="during">Saat Dikerjakan</SelectItem>
                          <SelectItem value="after">Sesudah</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Caption (opsional)</Label>
                      <Input
                        value={photoForm.caption}
                        onChange={(e) => setPhotoForm((prev) => ({ ...prev, caption: e.target.value }))}
                        placeholder="Keterangan foto..."
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Pilih Foto</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="h-9 flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={handlePhotoUpload}
                          disabled={!photoForm.file || photoMutation.isPending}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {previewUrl && (
                    <div className="mt-3">
                      <img src={previewUrl} alt="Preview" className="h-24 rounded-lg border" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canStart && (
                <Button
                  className="w-full"
                  onClick={() => statusMutation.mutate("in_progress")}
                  disabled={statusMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Mulai Kerjakan
                </Button>
              )}
              {canComplete && (
                <Button
                  className="w-full"
                  variant="success"
                  onClick={() => statusMutation.mutate("done")}
                  disabled={statusMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Selesai
                </Button>
              )}
              {!canStart && !canComplete && (
                <div className="text-center py-4">
                  <StatusBadge type="task" status={data.status} />
                  <p className="text-xs text-muted-foreground mt-2">
                    {data.status === "done" && "Menunggu verifikasi dari owner/admin"}
                    {data.status === "verified" && "Tiket sudah diverifikasi"}
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(buildWaLink(), "_blank")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Share WhatsApp
              </Button>
            </CardContent>
          </Card>

          {/* Timestamps Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Waktu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Dibuat</span>
                <p className="font-medium">{formatDateTime(data.created_at)}</p>
              </div>
              {data.started_at && (
                <div>
                  <span className="text-muted-foreground">Dimulai</span>
                  <p className="font-medium">{formatDateTime(data.started_at)}</p>
                </div>
              )}
              {data.completed_at && (
                <div>
                  <span className="text-muted-foreground">Selesai Dikerjakan</span>
                  <p className="font-medium">{formatDateTime(data.completed_at)}</p>
                </div>
              )}
              {data.verified_at && (
                <div>
                  <span className="text-muted-foreground">Diverifikasi</span>
                  <p className="font-medium">{formatDateTime(data.verified_at)}</p>
                </div>
              )}
              {data.verified_by && (
                <div>
                  <span className="text-muted-foreground">Diverifikasi Oleh</span>
                  <p className="font-medium">{data.verified_by}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
