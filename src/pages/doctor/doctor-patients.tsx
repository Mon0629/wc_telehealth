import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { format, parseISO } from "date-fns"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  PillIcon,
  XIcon,
} from "lucide-react"

import { PrescriptionDialog } from "@/components/video/PrescriptionDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  consultationNotesStorageKey,
  fetchConsultationNotes,
  parseStoredConsultationNotes,
  type ConsultationNotesForm,
} from "@/lib/consultation-notes"
import {
  fetchPrescription,
  parseStoredPrescription,
  prescriptionStorageKey,
  storePrescription,
  type PrescriptionItem,
} from "@/lib/prescription"
import { cn } from "@/lib/utils"
import useAppointmentStore, {
  formatTime24ToDisplay,
  type DoctorAppointmentItem,
  type DoctorAppointmentStatus,
} from "@/store/appointmentStore"

type PanelType = "notes" | "prescription"

interface PanelSelection {
  appointmentId: number
  patientName: string
  appointmentDate: string
  startTime: string
  type: PanelType
}

interface AppointmentRecordSummary {
  notes: ConsultationNotesForm | null
  prescription: PrescriptionItem[] | null
}

function StatusBadge({ status }: { status: DoctorAppointmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "Confirmed" && "bg-emerald-100 text-emerald-700",
        status === "Pending" && "bg-amber-100 text-amber-700",
        status === "Denied" && "bg-red-100 text-red-700",
        status === "Completed" && "bg-sky-100 text-sky-700",
        status === "Cancelled" && "bg-slate-100 text-slate-600",
      )}
    >
      {status}
    </span>
  )
}

function formatAppointmentDate(date: string) {
  try {
    return format(parseISO(date), "MMM d, yyyy")
  } catch {
    return date
  }
}

function hasConsultationNotes(notes: ConsultationNotesForm | null) {
  if (!notes) return false
  return (
    notes.chief_complaint.trim() ||
    notes.findings.trim() ||
    notes.diagnosis.trim() ||
    notes.recommendations.trim()
  )
}

function hasPrescription(items: PrescriptionItem[] | null) {
  return Boolean(items?.some((item) => item.medicine_name.trim()))
}

function shouldShowAddPrescription(
  status: DoctorAppointmentStatus,
  summary: AppointmentRecordSummary | undefined,
) {
  return (
    status === "Completed" &&
    hasConsultationNotes(summary?.notes ?? null) &&
    !hasPrescription(summary?.prescription ?? null)
  )
}

function getNotesCellAction(
  summary: AppointmentRecordSummary | undefined,
  isLoading: boolean,
) {
  if (isLoading) return { label: "Loading…", clickable: false as const }
  if (hasConsultationNotes(summary?.notes ?? null)) {
    return { label: "View notes", clickable: true as const }
  }
  return { label: "—", clickable: false as const }
}

function getPrescriptionCellAction(
  appointment: DoctorAppointmentItem,
  summary: AppointmentRecordSummary | undefined,
  isLoading: boolean,
) {
  if (isLoading) return { label: "Loading…", clickable: false as const, mode: "none" as const }

  if (shouldShowAddPrescription(appointment.status, summary)) {
    return {
      label: "Add Prescription",
      clickable: true as const,
      mode: "add" as const,
    }
  }

  if (hasPrescription(summary?.prescription ?? null)) {
    return {
      label: "View Prescription",
      clickable: true as const,
      mode: "view" as const,
    }
  }

  return { label: "—", clickable: false as const, mode: "none" as const }
}

function PatientsTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="border-slate-100">
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function RecordLinkButton({
  label,
  isActive,
  variant = "default",
  onClick,
}: {
  label: string
  isActive?: boolean
  variant?: "default" | "add"
  onClick?: () => void
}) {
  if (!onClick) {
    return <span className="text-sm text-slate-400">{label}</span>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "max-w-[200px] truncate text-left text-sm font-medium transition-colors hover:underline",
        variant === "add" &&
          (isActive
            ? "text-emerald-700 underline"
            : "text-emerald-600 hover:text-emerald-700"),
        variant === "default" &&
          (isActive
            ? "text-indigo-700 underline"
            : "text-indigo-600 hover:text-indigo-700"),
      )}
    >
      {label}
    </button>
  )
}

function DetailPanelShell({
  title,
  icon: Icon,
  patientName,
  appointmentDate,
  startTime,
  onClose,
  children,
}: {
  title: string
  icon: typeof ClipboardListIcon
  patientName: string
  appointmentDate: string
  startTime: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 lg:w-[360px] xl:w-[400px]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-indigo-500" />
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="border-b border-slate-100 px-5 py-3">
        <p className="text-sm font-semibold text-slate-900">{patientName}</p>
        <p className="text-xs text-slate-500">
          {formatAppointmentDate(appointmentDate)} ·{" "}
          {formatTime24ToDisplay(startTime)}
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
    </aside>
  )
}

function ConsultationNotesDetailPanel({
  selection,
  onClose,
}: {
  selection: PanelSelection
  onClose: () => void
}) {
  const [notes, setNotes] = useState<ConsultationNotesForm | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)

      const stored = parseStoredConsultationNotes(
        localStorage.getItem(
          consultationNotesStorageKey(selection.appointmentId),
        ),
      )

      try {
        const fetched = await fetchConsultationNotes(selection.appointmentId)
        if (cancelled) return
        setNotes(fetched ?? stored)
      } catch {
        if (cancelled) return
        setNotes(stored)
        setError("Could not load consultation notes from the server.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [selection.appointmentId])

  const fields: Array<{ key: keyof ConsultationNotesForm; label: string }> = [
    { key: "chief_complaint", label: "Chief complaint" },
    { key: "findings", label: "Findings" },
    { key: "diagnosis", label: "Diagnosis" },
    { key: "recommendations", label: "Recommendations" },
  ]

  return (
    <DetailPanelShell
      title="Consultation notes"
      icon={ClipboardListIcon}
      patientName={selection.patientName}
      appointmentDate={selection.appointmentDate}
      startTime={selection.startTime}
      onClose={onClose}
    >
      <div className="space-y-4 px-5 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : hasConsultationNotes(notes) ? (
          fields.map(({ key, label }) => (
            <section key={key} className="space-y-1">
              <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {label}
              </h3>
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                {notes?.[key]?.trim() || "—"}
              </p>
            </section>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            No consultation notes recorded for this appointment yet.
          </p>
        )}

        {error ? (
          <p className="text-xs text-amber-700">{error}</p>
        ) : null}
      </div>
    </DetailPanelShell>
  )
}

function PrescriptionDetailPanel({
  selection,
  onClose,
}: {
  selection: PanelSelection
  onClose: () => void
}) {
  const [items, setItems] = useState<PrescriptionItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const fetched = await fetchPrescription(selection.appointmentId)
        if (cancelled) return
        setItems(fetched)
      } catch {
        if (cancelled) return
        setItems(null)
        setError("Could not load prescription from the server.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [selection.appointmentId])

  return (
    <DetailPanelShell
      title="Prescription"
      icon={PillIcon}
      patientName={selection.patientName}
      appointmentDate={selection.appointmentDate}
      startTime={selection.startTime}
      onClose={onClose}
    >
      <div className="space-y-3 px-5 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : items?.length ? (
          items.map((item, index) => (
            <Card
              key={`${item.medicine_name}-${index}`}
              className="gap-0 border-slate-200 bg-slate-50/60 py-0 shadow-none"
            >
              <CardContent className="space-y-2 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {item.medicine_name || `Medicine ${index + 1}`}
                </p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                  {item.dosage ? (
                    <>
                      <dt className="font-medium text-slate-500">Dosage</dt>
                      <dd>{item.dosage}</dd>
                    </>
                  ) : null}
                  {item.frequency ? (
                    <>
                      <dt className="font-medium text-slate-500">Frequency</dt>
                      <dd>{item.frequency}</dd>
                    </>
                  ) : null}
                  {item.duration ? (
                    <>
                      <dt className="font-medium text-slate-500">Duration</dt>
                      <dd>{item.duration}</dd>
                    </>
                  ) : null}
                </dl>
                {item.instructions?.trim() ? (
                  <p className="text-xs leading-relaxed text-slate-600">
                    <span className="font-medium text-slate-700">
                      Instructions:
                    </span>{" "}
                    {item.instructions}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            No prescription recorded for this appointment yet.
          </p>
        )}

        {error ? (
          <p className="text-xs text-amber-700">{error}</p>
        ) : null}
      </div>
    </DetailPanelShell>
  )
}

const DoctorPatients = () => {
  const doctorAppointments = useAppointmentStore(
    (state) => state.doctorAppointments,
  )
  const appointmentsMeta = useAppointmentStore((state) => state.appointmentsMeta)
  const isLoadingAppointments = useAppointmentStore(
    (state) => state.isLoadingAppointments,
  )
  const appointmentsError = useAppointmentStore(
    (state) => state.appointmentsError,
  )
  const fetchDoctorAppointments = useAppointmentStore(
    (state) => state.fetchDoctorAppointments,
  )
  const clearAppointmentsError = useAppointmentStore(
    (state) => state.clearAppointmentsError,
  )

  const [panelSelection, setPanelSelection] = useState<PanelSelection | null>(
    null,
  )
  const [prescriptionDialogId, setPrescriptionDialogId] = useState<
    number | null
  >(null)
  const [summaries, setSummaries] = useState<
    Record<number, AppointmentRecordSummary>
  >({})
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false)

  useEffect(() => {
    fetchDoctorAppointments().catch(() => undefined)
  }, [fetchDoctorAppointments])

  const fetchAppointmentSummary = useCallback(
    async (appointmentId: number): Promise<AppointmentRecordSummary> => {
      const stored = parseStoredConsultationNotes(
        localStorage.getItem(consultationNotesStorageKey(appointmentId)),
      )

      const storedPrescription = parseStoredPrescription(
        localStorage.getItem(prescriptionStorageKey(appointmentId)),
      )

      const [notes, prescription] = await Promise.all([
        fetchConsultationNotes(appointmentId).catch(() => null),
        fetchPrescription(appointmentId).catch(() => storedPrescription),
      ])

      const resolvedPrescription = prescription ?? storedPrescription

      return {
        notes: notes ?? stored,
        prescription: hasPrescription(resolvedPrescription)
          ? resolvedPrescription
          : null,
      }
    },
    [],
  )

  const loadSummaries = useCallback(
    async (appointments: DoctorAppointmentItem[]) => {
      if (!appointments.length) {
        setSummaries({})
        return
      }

      setIsLoadingSummaries(true)

      try {
        const entries = await Promise.all(
          appointments.map(async (appointment) => {
            const summary = await fetchAppointmentSummary(appointment.id)
            return [appointment.id, summary] as const
          }),
        )

        setSummaries(Object.fromEntries(entries))
      } finally {
        setIsLoadingSummaries(false)
      }
    },
    [fetchAppointmentSummary],
  )

  const applyPrescriptionToSummary = useCallback(
    (appointmentId: number, items: PrescriptionItem[]) => {
      storePrescription(appointmentId, items)
      setSummaries((prev) => ({
        ...prev,
        [appointmentId]: {
          notes: prev[appointmentId]?.notes ?? null,
          prescription: items,
        },
      }))
    },
    [],
  )

  const handlePrescriptionSaved = useCallback(
    (appointmentId: number, items: PrescriptionItem[]) => {
      applyPrescriptionToSummary(appointmentId, items)
    },
    [applyPrescriptionToSummary],
  )

  useEffect(() => {
    if (isLoadingAppointments) return
    loadSummaries(doctorAppointments).catch(() => undefined)
  }, [doctorAppointments, isLoadingAppointments, loadSummaries])

  const openPanel = (
    appointment: DoctorAppointmentItem,
    type: PanelType,
  ) => {
    setPanelSelection({
      appointmentId: appointment.id,
      patientName: appointment.patientName,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      type,
    })
  }

  const handlePageChange = (page: number) => {
    setPanelSelection(null)
    fetchDoctorAppointments(page).catch(() => undefined)
  }

  const hasPatients = doctorAppointments.length > 0

  const panelKey = useMemo(
    () =>
      panelSelection
        ? `${panelSelection.appointmentId}-${panelSelection.type}`
        : null,
    [panelSelection],
  )

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 items-center gap-2 border-b border-slate-100 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-slate-700">My Patients</span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-5 lg:flex-row lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              My Patients
            </h1>
            <p className="text-sm text-slate-500">
              View your patients, appointment history, consultation notes, and
              prescriptions.
            </p>
          </div>

          {appointmentsError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{appointmentsError}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-red-700 hover:bg-red-100"
                onClick={() => {
                  clearAppointmentsError()
                  fetchDoctorAppointments().catch(() => undefined)
                }}
              >
                Retry
              </Button>
            </div>
          ) : null}

          <Card className="w-full gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="h-11 px-4 text-slate-600">
                      Patient
                    </TableHead>
                    <TableHead className="h-11 px-4 text-slate-600">
                      Appointment date
                    </TableHead>
                    <TableHead className="h-11 px-4 text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="h-11 px-4 text-slate-600">
                      Consultation notes
                    </TableHead>
                    <TableHead className="h-11 px-4 text-slate-600">
                      Prescription
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAppointments ? (
                    <PatientsTableSkeleton />
                  ) : hasPatients ? (
                    doctorAppointments.map((appointment) => {
                      const summary = summaries[appointment.id]
                      const notesAction = getNotesCellAction(
                        summary,
                        isLoadingSummaries,
                      )
                      const prescriptionAction = getPrescriptionCellAction(
                        appointment,
                        summary,
                        isLoadingSummaries,
                      )

                      const notesActive =
                        panelSelection?.appointmentId === appointment.id &&
                        panelSelection.type === "notes"
                      const prescriptionActive =
                        panelSelection?.appointmentId === appointment.id &&
                        panelSelection.type === "prescription"

                      return (
                        <TableRow
                          key={appointment.id}
                          className="border-slate-100"
                        >
                          <TableCell className="px-4 py-3 font-medium text-slate-800">
                            {appointment.patientName}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-slate-600">
                            <div>
                              {formatAppointmentDate(
                                appointment.appointmentDate,
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              {formatTime24ToDisplay(appointment.startTime)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <StatusBadge status={appointment.status} />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <RecordLinkButton
                              label={notesAction.label}
                              isActive={notesActive}
                              onClick={
                                notesAction.clickable
                                  ? () => openPanel(appointment, "notes")
                                  : undefined
                              }
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <RecordLinkButton
                              label={prescriptionAction.label}
                              variant={
                                prescriptionAction.mode === "add"
                                  ? "add"
                                  : "default"
                              }
                              isActive={prescriptionActive}
                              onClick={
                                prescriptionAction.clickable
                                  ? () => {
                                      if (prescriptionAction.mode === "add") {
                                        setPrescriptionDialogId(appointment.id)
                                        return
                                      }
                                      openPanel(appointment, "prescription")
                                    }
                                  : undefined
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No patients yet. Appointments will appear here once
                        patients book with you.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {appointmentsMeta && appointmentsMeta.totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Page {appointmentsMeta.page} of {appointmentsMeta.totalPages} ·{" "}
                {appointmentsMeta.total} appointment
                {appointmentsMeta.total !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    !appointmentsMeta.hasPrevPage || isLoadingAppointments
                  }
                  onClick={() => handlePageChange(appointmentsMeta.page - 1)}
                  className="h-8 gap-1 rounded-lg"
                >
                  <ChevronLeftIcon className="size-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    !appointmentsMeta.hasNextPage || isLoadingAppointments
                  }
                  onClick={() => handlePageChange(appointmentsMeta.page + 1)}
                  className="h-8 gap-1 rounded-lg"
                >
                  Next
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {panelSelection && panelKey ? (
          panelSelection.type === "notes" ? (
            <ConsultationNotesDetailPanel
              key={panelKey}
              selection={panelSelection}
              onClose={() => setPanelSelection(null)}
            />
          ) : (
            <PrescriptionDetailPanel
              key={panelKey}
              selection={panelSelection}
              onClose={() => setPanelSelection(null)}
            />
          )
        ) : null}
      </div>

      <PrescriptionDialog
        open={prescriptionDialogId !== null}
        onOpenChange={(open) => {
          if (!open) setPrescriptionDialogId(null)
        }}
        appointmentId={prescriptionDialogId ?? 0}
        onSaved={handlePrescriptionSaved}
      />
    </div>
  )
}

export default DoctorPatients
