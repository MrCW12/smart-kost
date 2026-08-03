import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import useAuthStore from "@/stores/authStore"
import { cleaningApi, propertyApi, roomApi, taskGroupApi } from "@/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LoadingButton } from "@/components/shared/loading-button"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingPage } from "@/components/shared/spinner"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatDate } from "@/lib/utils"
import { TASK_PRIORITY } from "@/lib/constants"
import { PaginationNav } from "@/components/shared/pagination-nav"
import { ClipboardList, Play, CheckCircle, ShieldCheck, Plus, ImagePlus, Users, Pencil, Trash2, MessageCircle } from "lucide-react"

const TASK_TYPES = [
  { value: "cleaning", label: "Pembersihan" },
  { value: "maintenance", label: "Maintenance" },
  { value: "checkout", label: "Checkout" },
  { value: "periodic", label: "Berkala" },
  { value: "request", label: "Permintaan" },
]

const statusActions = {
  waiting: [{ status: "in_progress", label: "Mulai", icon: Play, color: "text-blue-600" }],
  in_progress: [{ status: "done", label: "Selesai", icon: CheckCircle, color: "text-green-600" }],
  done: [{ status: "verified", label: "Verifikasi", icon: ShieldCheck, color: "text-purple-600" }],
}

export default function RoomTaskManagement({ type }) {
  const { user } = useAuthStore()
  const userPerms = new Set(user?.effective_permissions || [])
  const canAssign = userPerms.has("cleaning.assign")
  const canVerify = userPerms.has("cleaning.verify")
  const visibleStatusActions = (status) =>
    (statusActions[status] || []).filter((a) => a.status !== "verified" || canVerify)

  const fixedType = type || ""
  const [typeFilter, setTypeFilter] = useState(fixedType)
  const activeType = fixedType || typeFilter

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [groupFilter, setGroupFilter] = useState("")
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [groupManageOpen, setGroupManageOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState("")
  const [photoFile, setPhotoFile] = useState(null)
  const [photoType, setPhotoType] = useState("before")
  const [photoCaption, setPhotoCaption] = useState("")
  const [createType, setCreateType] = useState(fixedType || "cleaning")
  const [createProperty, setCreateProperty] = useState("")
  const [createRoom, setCreateRoom] = useState("")
  const [createPriority, setCreatePriority] = useState("medium")
  const [createGroup, setCreateGroup] = useState("")
  const [createAssignedTo, setCreateAssignedTo] = useState("")
  const [createNotes, setCreateNotes] = useState("")
  const [createPhotoFile, setCreatePhotoFile] = useState(null)
  const [createPhotoPreview, setCreatePhotoPreview] = useState("")
  const [groupFormName, setGroupFormName] = useState("")
  const [groupFormDescription, setGroupFormDescription] = useState("")
  const [groupFormMembers, setGroupFormMembers] = useState([])
  const [groupEditId, setGroupEditId] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", activeType, page, statusFilter, groupFilter],
    queryFn: () => {
      const params = { page, per_page: 15 }
      if (activeType) params.type = activeType
      if (statusFilter) params.status = statusFilter
      if (groupFilter) params.group_id = groupFilter
      return cleaningApi.list(params).then((res) => res.data)
    },
  })

  const { data: detail } = useQuery({
    queryKey: ["task-detail", selected?.id],
    queryFn: () => cleaningApi.get(selected?.id).then((res) => res.data.data),
    enabled: !!selected?.id && detailOpen,
  })

  const { data: properties } = useQuery({
    queryKey: ["properties-list"],
    queryFn: () => propertyApi.list({ per_page: 100 }).then((res) => res.data.data),
  })

  const { data: rooms } = useQuery({
    queryKey: ["rooms-options", createProperty],
    queryFn: () => createProperty ? roomApi.list(createProperty, { per_page: 100 }).then((res) => res.data.data) : [],
    enabled: !!createProperty,
  })

  const { data: assignableUsers } = useQuery({
    queryKey: ["task-assignable-users", createProperty, createGroup],
    queryFn: () => createProperty ? cleaningApi.assignableUsers({ property_id: createProperty, group_id: createGroup || undefined }).then((res) => res.data.data) : [],
    enabled: !!createProperty,
  })

  const { data: taskGroups } = useQuery({
    queryKey: ["task-groups"],
    queryFn: () => taskGroupApi.list().then((res) => res.data.data),
  })

  const { data: groupCandidates } = useQuery({
    queryKey: ["task-group-candidates"],
    queryFn: () => taskGroupApi.candidates().then((res) => res.data.data),
    enabled: groupManageOpen,
  })

  const { data: activeTasks } = useQuery({
    queryKey: ["active-tasks"],
    queryFn: () => {
      const params = { per_page: 100 }
      if (activeType) params.type = activeType
      return cleaningApi.list(params).then((res) => res.data.data)
    },
  })

  const activeRoomIds = new Set((activeTasks || [])
    .filter((t) => t.status === "waiting" || t.status === "in_progress")
    .map((t) => t.room?.id))

  const statusMutation = useMutation({
    mutationFn: ({ id, data }) => cleaningApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"])
      queryClient.invalidateQueries(["task-detail"])
      queryClient.invalidateQueries(["active-tasks"])
    },
  })

  const photoMutation = useMutation({
    mutationFn: ({ id, formData }) => cleaningApi.addPhoto(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(["task-detail"])
      setPhotoFile(null)
      setPhotoType("before")
      setPhotoCaption("")
    },
  })

  const handlePhotoUpload = (e) => {
    e.preventDefault()
    if (!photoFile) return
    const formData = new FormData()
    formData.append("file", photoFile)
    formData.append("type", photoType)
    if (photoCaption) formData.append("caption", photoCaption)
    photoMutation.mutate({ id: selected?.id, formData })
  }

  const resetCreateForm = () => {
    setCreateProperty("")
    setCreateRoom("")
    setCreatePriority("medium")
    setCreateGroup("")
    setCreateAssignedTo("")
    setCreateNotes("")
    setCreatePhotoFile(null)
    setCreatePhotoPreview("")
  }

  const resetGroupForm = () => {
    setGroupFormName("")
    setGroupFormDescription("")
    setGroupFormMembers([])
    setGroupEditId(null)
  }

  const toggleMember = (id) => {
    setGroupFormMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const startEditGroup = (g) => {
    setGroupEditId(g.id)
    setGroupFormName(g.name)
    setGroupFormDescription(g.description || "")
    setGroupFormMembers((g.members || []).map((m) => m.id.toString()))
  }

  const handleGroupSubmit = (e) => {
    e.preventDefault()
    if (!groupFormName.trim()) return
    const payload = {
      name: groupFormName.trim(),
      description: groupFormDescription || undefined,
      member_ids: groupFormMembers.map(Number),
    }
    groupSaveMutation.mutate(groupEditId ? { id: groupEditId, data: payload } : { id: null, data: payload })
  }

  const handleGroupDelete = (g) => {
    if (!window.confirm(`Hapus group "${g.name}"?`)) return
    groupDeleteMutation.mutate(g.id)
  }

  const groupSaveMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? taskGroupApi.update(id, data) : taskGroupApi.create(data)),
    onSuccess: () => {
      queryClient.invalidateQueries(["task-groups"])
      queryClient.invalidateQueries(["task-assignable-users"])
      resetGroupForm()
    },
  })

  const groupDeleteMutation = useMutation({
    mutationFn: (id) => taskGroupApi.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["task-groups"])
      queryClient.invalidateQueries(["tasks"])
    },
  })

  const createMutation = useMutation({
    mutationFn: (data) => cleaningApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"])
      queryClient.invalidateQueries(["active-tasks"])
      queryClient.invalidateQueries(["rooms-options"])
      setCreateOpen(false)
      resetCreateForm()
    },
  })

  const handleStatusUpdate = (id, status) => {
    statusMutation.mutate({ id, data: { status, notes } })
    setDetailOpen(false)
    setNotes("")
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!createType || !createProperty || !createRoom) return
    if (createPhotoFile) {
      const formData = new FormData()
      formData.append("property_id", Number(createProperty))
      formData.append("room_id", Number(createRoom))
      formData.append("type", createType)
      formData.append("priority", createPriority)
      if (createNotes) formData.append("notes", createNotes)
      if (createGroup) formData.append("group_id", Number(createGroup))
      if (createAssignedTo) formData.append("assigned_to", Number(createAssignedTo))
      formData.append("file", createPhotoFile)
      createMutation.mutate(formData)
      return
    }
    const payload = {
      property_id: Number(createProperty),
      room_id: Number(createRoom),
      type: createType,
      priority: createPriority,
      notes: createNotes || undefined,
    }
    if (createGroup) payload.group_id = Number(createGroup)
    if (createAssignedTo) payload.assigned_to = Number(createAssignedTo)
    createMutation.mutate(payload)
  }

  if (isLoading) return <LoadingPage />
  const items = data?.data || []

  const buildWaLink = (task) => {
    const typeLabel = TASK_TYPES.find((t) => t.value === task.type)?.label || task.type
    const lines = [
      "TASK SMART KOST",
      "Room: " + (task.room?.number || "-"),
      "Properti: " + (task.property?.name || "-"),
      "Jenis: " + typeLabel,
      "Prioritas: " + (TASK_PRIORITY[task.priority] || task.priority),
      "Group: " + (task.group?.name || "-"),
      "Dikerjakan: " + (task.assigned_to || "-"),
      "Status: " + (task.status || "-"),
      "Catatan: " + (task.notes || "-"),
      "Dibuat: " + formatDate(task.created_at),
    ]
    return "https://wa.me/?text=" + encodeURIComponent(lines.join("\n"))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Task</h2>
          <p className="text-sm text-muted-foreground">Kelola pembersihan & maintenance kamar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!fixedType && (
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Jenis" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {TASK_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="waiting">Menunggu</SelectItem>
              <SelectItem value="in_progress">Dikerjakan</SelectItem>
              <SelectItem value="done">Selesai</SelectItem>
              <SelectItem value="verified">Terverifikasi</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupFilter} onValueChange={(v) => setGroupFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Group" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Group</SelectItem>
              {(taskGroups || []).map((g) => (
                <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setGroupManageOpen(true)} hidden={!canAssign}>
            <Users className="mr-2 h-4 w-4" />
            Kelola Group
          </Button>
          <Button onClick={() => setCreateOpen(true)} hidden={!canAssign}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Task
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Properti</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState title="Tidak ada task" icon={ClipboardList} />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.room?.number}</TableCell>
                    <TableCell>{item.property?.name}</TableCell>
                    <TableCell>
                      <span className="capitalize">{TASK_TYPES.find((t) => t.value === item.type)?.label || item.type}</span>
                    </TableCell>
                    <TableCell>{item.group?.name || '-'}</TableCell>
                    <TableCell>{TASK_PRIORITY[item.priority] || item.priority}</TableCell>
                    <TableCell>{item.assigned_to || '-'}</TableCell>
                    <TableCell><StatusBadge type="task" status={item.status} /></TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelected(item); setDetailOpen(true) }}>
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Kirim ke WhatsApp" onClick={() => window.open(buildWaLink(item), "_blank")}>
                          <MessageCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        {visibleStatusActions(item.status).map((action) => (
                          <Button key={action.status} variant="ghost" size="icon" title={action.label}
                            onClick={() => handleStatusUpdate(item.id, action.status)}>
                            <action.icon className={`h-4 w-4 ${action.color}`} />
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <PaginationNav page={page} lastPage={data?.meta?.last_page} onPageChange={setPage} />

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Task</DialogTitle>
            <DialogDescription>Room {detail?.room?.number} - {detail?.property?.name}</DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Jenis:</span>{" "}
                  <span className="capitalize font-medium">{TASK_TYPES.find((t) => t.value === detail.type)?.label || detail.type}</span>
                </div>
                <div><span className="text-muted-foreground">Prioritas:</span> <span className="capitalize font-medium">{TASK_PRIORITY[detail.priority] || detail.priority}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge type="task" status={detail.status} /></div>
                <div><span className="text-muted-foreground">Assigned:</span> <span className="font-medium">{detail.assigned_to || '-'}</span></div>
                <div><span className="text-muted-foreground">Group:</span> <span className="font-medium">{detail.group?.name || '-'}</span></div>
              </div>
              <a href={buildWaLink(detail)} target="_blank" rel="noreferrer">
                <Button type="button" variant="outline" className="w-full">
                  <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                  Kirim ke WhatsApp
                </Button>
              </a>
              {detail.notes && (
                <div><span className="text-muted-foreground text-sm">Catatan:</span><p className="text-sm mt-1">{detail.notes}</p></div>
              )}
              {detail.photos?.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Foto ({detail.photos.length})</span>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {detail.photos.map((photo) => (
                      <figure key={photo.id} className="w-40">
                        <img
                          src={photo.url?.replace(/^https?:\/\/[^/]+/, "")}
                          alt={photo.caption || photo.type}
                          className="h-28 w-full rounded-md border object-cover"
                        />
                        <figcaption className="mt-1 text-xs">
                          <span className="capitalize font-medium">{photo.type}</span>
                          {photo.caption ? ` - ${photo.caption}` : ""}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
              <form onSubmit={handlePhotoUpload} className="space-y-2 border-t pt-3">
                <span className="text-muted-foreground text-sm">Tambah Foto</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipe Foto</Label>
                    <Select value={photoType} onValueChange={setPhotoType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">Sebelum</SelectItem>
                        <SelectItem value="during">Proses</SelectItem>
                        <SelectItem value="after">Sesudah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Keterangan</Label>
                    <Input
                      type="text"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="Opsional"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <LoadingButton type="submit" loading={photoMutation.isPending} disabled={!photoFile}>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Upload
                  </LoadingButton>
                </div>
              </form>
              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tambah catatan..." />
              </div>
            </div>
          ) : (
            <LoadingPage />
          )}
        </DialogContent>
      </Dialog>

      {/* Create task dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Task</DialogTitle>
            <DialogDescription>Pilih kamar yang perlu dibersihkan atau diperbaiki</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {!fixedType && (
              <div className="space-y-2">
                <Label>Jenis Task *</Label>
                <Select value={createType} onValueChange={setCreateType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Properti *</Label>
              <Select value={createProperty} onValueChange={(v) => { setCreateProperty(v); setCreateRoom(""); setCreateGroup(""); setCreateAssignedTo("") }}>
                <SelectTrigger><SelectValue placeholder="Pilih properti" /></SelectTrigger>
                <SelectContent>
                  {(properties || []).map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kamar *</Label>
              <Select value={createRoom} onValueChange={setCreateRoom} disabled={!createProperty}>
                <SelectTrigger><SelectValue placeholder={createProperty ? "Pilih kamar" : "Pilih properti dulu"} /></SelectTrigger>
                <SelectContent>
                  {(rooms || []).map((r) => (
                    <SelectItem
                      key={r.id}
                      value={r.id.toString()}
                      disabled={activeRoomIds.has(r.id)}
                    >
                      Room {r.number} - {r.room_type?.name || '-'} {activeRoomIds.has(r.id) ? "(sudah ada task)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Group (opsional)</Label>
              <Select value={createGroup} onValueChange={(v) => { setCreateGroup(v); setCreateAssignedTo("") }} disabled={!createProperty}>
                <SelectTrigger><SelectValue placeholder={createProperty ? "Pilih group tujuan" : "Pilih properti dulu"} /></SelectTrigger>
                <SelectContent>
                  {(taskGroups || []).map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name} {g.members?.length ? `(${g.members.length} anggota)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Task dikirim ke group pekerja. Daftar pekerja di bawah otomatis menyesuaikan anggota group.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Dikerjakan Oleh</Label>
              <Select value={createAssignedTo} onValueChange={setCreateAssignedTo} disabled={!createProperty}>
                <SelectTrigger><SelectValue placeholder={createProperty ? "Pilih pekerja" : "Pilih properti dulu"} /></SelectTrigger>
                <SelectContent>
                  {(assignableUsers || []).map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name} <span className="text-muted-foreground">({u.role})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioritas</Label>
              <Select value={createPriority} onValueChange={setCreatePriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITY).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea value={createNotes} onChange={(e) => setCreateNotes(e.target.value)} placeholder="Deskripsi kerusakan / kebutuhan..." />
            </div>
            <div className="space-y-2">
              <Label>Foto Area (opsional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setCreatePhotoFile(f)
                  setCreatePhotoPreview(f ? URL.createObjectURL(f) : "")
                }}
                className="cursor-pointer"
              />
              {createPhotoPreview && (
                <img
                  src={createPhotoPreview}
                  alt="Preview area"
                  className="h-32 w-48 rounded-md border object-cover"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Lampirkan foto area yang kotor/rusak agar pekerja langsung tahu bagian mana.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); resetCreateForm() }}>Batal</Button>
              <LoadingButton type="submit" loading={createMutation.isPending} disabled={!createType || !createProperty || !createRoom}>
                Simpan
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Group management dialog */}
      <Dialog open={groupManageOpen} onOpenChange={setGroupManageOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Group Task</DialogTitle>
            <DialogDescription>
              Buat group pekerja (mis. Tim Kebersihan, Tim Perbaikan) lalu kirim task ke group tersebut.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGroupSubmit} className="space-y-3 rounded-lg border p-4">
            <div className="space-y-1">
              <Label>Nama Group *</Label>
              <Input value={groupFormName} onChange={(e) => setGroupFormName(e.target.value)} placeholder="cth: Tim Kebersihan" />
            </div>
            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Textarea value={groupFormDescription} onChange={(e) => setGroupFormDescription(e.target.value)} placeholder="Opsional" />
            </div>
            <div className="space-y-1">
              <Label>Anggota</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                {groupCandidates?.length === 0 && (
                  <p className="py-2 text-center text-xs text-muted-foreground">Tidak ada pekerja tersedia.</p>
                )}
                {groupCandidates?.map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={groupFormMembers.includes(u.id.toString())}
                      onChange={() => toggleMember(u.id.toString())}
                    />
                    {u.name} <span className="text-xs text-muted-foreground">({u.role})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <LoadingButton type="submit" loading={groupSaveMutation.isPending} disabled={!groupFormName.trim()}>
                {groupEditId ? "Simpan Perubahan" : "Tambah Group"}
              </LoadingButton>
              {groupEditId && (
                <Button type="button" variant="outline" onClick={resetGroupForm}>Batal Edit</Button>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {taskGroups?.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Belum ada group. Buat group di atas.</p>
            )}
            {taskGroups?.map((g) => (
              <div key={g.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => startEditGroup(g)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Hapus" onClick={() => handleGroupDelete(g)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {g.members?.length === 0 && (
                    <span className="text-xs text-muted-foreground">Belum ada anggota</span>
                  )}
                  {g.members?.map((m) => (
                    <span key={m.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">{m.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
