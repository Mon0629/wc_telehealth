import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { format, parseISO } from "date-fns"
import { ClipboardListIcon, PillIcon, XIcon } from "lucide-react"

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
import type { ConsultationNotesForm } from "@/lib/consultation-notes"
import {
  buildMedicalRecordRows,
  fetchMyPatientProfileId,
  fetchPatientMedicalRecords,
  fetchPatientPrescriptions,
  getErrorMessage,
  hasConsultationNotes,
  hasPrescription,
  type PatientMedicalRecordRow,
} from "@/lib/patient-medical-records"
import type { PrescriptionItem } from "@/lib/prescription"
import { cn } from "@/lib/utils"
import useAppointmentStore, {
  formatTime24ToDisplay,
  type PatientAppointmentItem,
} from "@/store/appointmentStore"

type PanelType = "notes" | "prescription"

interface PanelSelection {
  appointmentId: number
  doctorName: string
  appointmentDate: string
  startTime: string
  type: PanelType
  notes: ConsultationNotesForm | null
  prescription: PrescriptionItem[] | null
}

function formatAppointmentDate(date: string) {
  if (!date) return "—"
  try {
    return format(parseISO(date), "MMM d, yyyy")
  } catch {
    return date
  }
}

function MedicalRecordsTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="border-slate-100">
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-24" />
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
  onClick,
}: {
  label: string
  isActive?: boolean
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
        "max-w-[200px] truncate text-left text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 hover:underline",
        isActive && "text-indigo-700 underline",
      )}
    >
      {label}
    </button>
  )
}

function DetailPanelShell({
  title,
  icon: Icon,
  doctorName,
  appointmentDate,
  startTime,
  onClose,
  children,
}: {
  title: string
  icon: typeof ClipboardListIcon
  doctorName: string
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
        <p className="text-sm font-semibold text-slate-900">{doctorName}</p>
        <p className="text-xs text-slate-500">
          {formatAppointmentDate(appointmentDate)}
          {startTime ? ` · ${formatTime24ToDisplay(startTime)}` : null}
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
  const notes = selection.notes

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
      doctorName={selection.doctorName}
      appointmentDate={selection.appointmentDate}
      startTime={selection.startTime}
      onClose={onClose}
    >
      <div className="space-y-4 px-5 py-4">
        {hasConsultationNotes(notes) ? (
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
            No consultation notes recorded for this appointment.
          </p>
        )}
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
  const items = selection.prescription

  return (
    <DetailPanelShell
      title="Prescription"
      icon={PillIcon}
      doctorName={selection.doctorName}
      appointmentDate={selection.appointmentDate}
      startTime={selection.startTime}
      onClose={onClose}
    >
      <div className="space-y-3 px-5 py-4">
        {items?.length ? (
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
            No prescription recorded for this appointment.
          </p>
        )}
      </div>
    </DetailPanelShell>
  )
}

const PatientMedicalRecords = () => {
  const fetchPatientAppointments = useAppointmentStore(
    (state) => state.fetchPatientAppointments,
  )

  const [rows, setRows] = useState<PatientMedicalRecordRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [panelSelection, setPanelSelection] = useState<PanelSelection | null>(
    null,
  )

  const loadMedicalRecords = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const patientProfileId = await fetchMyPatientProfileId()

      const [appointments, medicalRecords, prescriptions] = await Promise.all([
        fetchPatientAppointments(1),
        fetchPatientMedicalRecords(patientProfileId),
        fetchPatientPrescriptions(patientProfileId),
      ])

      const appointmentRows = appointments.map(
        (appointment: PatientAppointmentItem) => ({
          id: appointment.id,
          doctorName: appointment.doctorName,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
        }),
      )

      setRows(
        buildMedicalRecordRows(appointmentRows, medicalRecords, prescriptions),
      )
    } catch (err) {
      setLoadError(getErrorMessage(err, "Failed to load medical records"))
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [fetchPatientAppointments])

  useEffect(() => {
    loadMedicalRecords().catch(() => undefined)
  }, [loadMedicalRecords])

  const openPanel = (row: PatientMedicalRecordRow, type: PanelType) => {
    setPanelSelection({
      appointmentId: row.appointmentId,
      doctorName: row.doctorName,
      appointmentDate: row.appointmentDate,
      startTime: row.startTime,
      type,
      notes: row.notes,
      prescription: row.prescription,
    })
  }

  const hasRecords = rows.length > 0

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
        <span className="text-sm font-medium text-slate-700">
          Medical Records
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-5 lg:flex-row lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              My Medical Records
            </h1>
            <p className="text-sm text-slate-500">
              View consultation notes and prescriptions from your past
              appointments.
            </p>
          </div>

          {loadError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{loadError}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-red-700 hover:bg-red-100"
                onClick={() => {
                  loadMedicalRecords().catch(() => undefined)
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
                      Doctor
                    </TableHead>
                    <TableHead className="h-11 px-4 text-slate-600">
                      Appointment date
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
                  {isLoading ? (
                    <MedicalRecordsTableSkeleton />
                  ) : hasRecords ? (
                    rows.map((row) => {
                      const notesActive =
                        panelSelection?.appointmentId === row.appointmentId &&
                        panelSelection.type === "notes"
                      const prescriptionActive =
                        panelSelection?.appointmentId === row.appointmentId &&
                        panelSelection.type === "prescription"

                      return (
                        <TableRow
                          key={row.appointmentId}
                          className="border-slate-100"
                        >
                          <TableCell className="px-4 py-3 font-medium text-slate-800">
                            {row.doctorName}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-slate-600">
                            <div>
                              {formatAppointmentDate(row.appointmentDate)}
                            </div>
                            {row.startTime ? (
                              <div className="text-xs text-slate-400">
                                {formatTime24ToDisplay(row.startTime)}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <RecordLinkButton
                              label={
                                hasConsultationNotes(row.notes)
                                  ? "View notes"
                                  : "—"
                              }
                              isActive={notesActive}
                              onClick={
                                hasConsultationNotes(row.notes)
                                  ? () => openPanel(row, "notes")
                                  : undefined
                              }
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <RecordLinkButton
                              label={
                                hasPrescription(row.prescription)
                                  ? "View prescription"
                                  : "—"
                              }
                              isActive={prescriptionActive}
                              onClick={
                                hasPrescription(row.prescription)
                                  ? () => openPanel(row, "prescription")
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
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No medical records yet. Notes and prescriptions will
                        appear here after your doctor completes a visit.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

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
    </div>
  )
}

export default PatientMedicalRecords
