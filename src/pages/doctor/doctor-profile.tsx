import { useEffect, useRef, useState } from "react"
import {
  CalendarClockIcon,
  CameraIcon,
  PlusIcon,
  StethoscopeIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DAYS_OF_WEEK } from "@/lib/doctor-profile-payload"
import useAuthStore from "@/store/authStore"
import useDoctorProfileStore, {
  type AvailabilitySlot,
  type DayOfWeek,
  type DoctorProfileDetails,
  normalizeDoctorProfile,
} from "@/store/doctorProfileStore"

// ─── style constants ─────────────────────────────────────────────────────────

const inputClassName =
  "h-11 rounded-xl border-sky-100 bg-sky-50/50 px-4 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"

const timeInputClassName = `${inputClassName} [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-90 [&::-webkit-calendar-picker-indicator]:brightness-0`

const readOnlyClassName =
  "h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-50 px-4 text-slate-600"

const textareaClassName =
  "resize-none rounded-xl border-sky-100 bg-sky-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"

const selectClassName =
  "h-11 w-full rounded-xl border border-sky-100 bg-sky-50/50 px-4 text-sm text-slate-900 outline-none focus-visible:border-sky-300 focus-visible:ring-3 focus-visible:ring-sky-200/60"

// ─── constants ───────────────────────────────────────────────────────────────

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]

// ─── helpers ─────────────────────────────────────────────────────────────────

function getDayOptionsForSlot(
  slots: AvailabilitySlot[],
  slotId: string,
): { value: DayOfWeek; label: string }[] {
  const usedByOthers = new Set(
    slots.filter((s) => s.id !== slotId).map((s) => s.dayOfWeek),
  )
  const currentDay = slots.find((s) => s.id === slotId)?.dayOfWeek
  return DAYS_OF_WEEK.filter(
    (day) => !usedByOthers.has(day.value) || day.value === currentDay,
  )
}

function createAvailabilitySlot(
  existingSlots: AvailabilitySlot[],
): AvailabilitySlot | null {
  const usedDays = new Set(existingSlots.map((s) => s.dayOfWeek))
  const nextDay = DAYS_OF_WEEK.find((day) => !usedDays.has(day.value))
  if (!nextDay) return null
  return {
    id: crypto.randomUUID(),
    dayOfWeek: nextDay.value,
    startTime: "09:00",
    endTime: "17:00",
  }
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return time24
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 || 12
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`
}

function getDayLabel(day: DayOfWeek): string {
  return DAYS_OF_WEEK.find((d) => d.value === day)?.label ?? day
}

function getInitials(name: string, email: string): string {
  const fromName = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
  return fromName || email.slice(0, 2).toUpperCase()
}

// ─── ProfileAvatarPicker ─────────────────────────────────────────────────────

function ProfileAvatarPicker({
  avatarUrl,
  displayName,
  email,
  onChange,
}: {
  avatarUrl: string
  displayName: string
  email: string
  /** Called with (previewDataUrl, rawFile). rawFile is null on remove. */
  onChange: (url: string, file: File | null) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initials = getInitials(displayName, email)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Please choose a JPG, PNG, or WebP image.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 2 MB or smaller.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result, file)
      }
    }
    reader.onerror = () => toast.error("Could not read the image. Try again.")
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <Avatar className="size-24 rounded-2xl ring-4 ring-white shadow-md after:rounded-full">
          <AvatarImage
            src={avatarUrl}
            alt={displayName || "Profile"}
            className="rounded-full"
          />
          <AvatarFallback className="rounded-full bg-sky-100 text-xl font-semibold text-sky-700">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full border-2 border-white bg-sky-600 text-white shadow-sm transition hover:bg-sky-700"
          aria-label="Change profile picture"
        >
          <CameraIcon className="size-4" />
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_AVATAR_TYPES.join(",")}
        className="sr-only"
        onChange={handleFileChange}
      />
      {avatarUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 rounded-full text-slate-500 hover:text-slate-900"
          onClick={() => onChange("", null)}
        >
          Remove photo
        </Button>
      ) : null}
    </div>
  )
}

// ─── AvailabilityEditor ───────────────────────────────────────────────────────

function AvailabilityEditor({
  slots,
  onChange,
}: {
  slots: AvailabilitySlot[]
  onChange: (slots: AvailabilitySlot[]) => void
}) {
  const safeSlots = Array.isArray(slots) ? slots : []

  const updateSlot = (id: string, patch: Partial<AvailabilitySlot>) =>
    onChange(safeSlots.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const removeSlot = (id: string) =>
    onChange(safeSlots.filter((s) => s.id !== id))

  const allDaysScheduled = safeSlots.length >= DAYS_OF_WEEK.length

  const addSlot = () => {
    const next = createAvailabilitySlot(safeSlots)
    if (!next) {
      toast.error("All days of the week already have availability.")
      return
    }
    onChange([...safeSlots, next])
  }

  return (
    <div className="flex flex-col gap-3">
      {safeSlots.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-6 text-center text-sm text-slate-500">
          No availability added yet. Add when patients can book you.
        </p>
      ) : (
        safeSlots.map((slot) => (
          <div
            key={slot.id}
            className="rounded-xl border border-sky-100 bg-sky-50/30 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
              <Field className="gap-2">
                <FieldLabel htmlFor={`day-${slot.id}`}>Day</FieldLabel>
                <select
                  id={`day-${slot.id}`}
                  value={slot.dayOfWeek}
                  onChange={(e) =>
                    updateSlot(slot.id, { dayOfWeek: e.target.value as DayOfWeek })
                  }
                  className={selectClassName}
                >
                  {getDayOptionsForSlot(safeSlots, slot.id).map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field className="gap-2">
                <FieldLabel htmlFor={`start-${slot.id}`}>From</FieldLabel>
                <Input
                  id={`start-${slot.id}`}
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                  className={timeInputClassName}
                  required
                />
              </Field>
              <Field className="gap-2">
                <FieldLabel htmlFor={`end-${slot.id}`}>To</FieldLabel>
                <Input
                  id={`end-${slot.id}`}
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })}
                  className={timeInputClassName}
                  required
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600 sm:mb-0.5"
                onClick={() => removeSlot(slot.id)}
                aria-label="Remove availability"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {getDayLabel(slot.dayOfWeek)} · {formatTime12h(slot.startTime)} –{" "}
              {formatTime12h(slot.endTime)}
            </p>
          </div>
        ))
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full border-sky-200 text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={addSlot}
        disabled={allDaysScheduled}
      >
        <PlusIcon className="size-4" />
        {allDaysScheduled ? "All days scheduled" : "Add availability"}
      </Button>
    </div>
  )
}

// ─── SectionHeading ───────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 pb-1">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100">
        <Icon className="size-4 text-sky-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}

// ─── DoctorProfileModal ───────────────────────────────────────────────────────

export function DoctorProfileModal() {
  const { user, isFirstLogin, completeFirstLogin } = useAuthStore()
  const { isOpen, closeProfile, profile, saveProfile, isLoading, clearError } =
    useDoctorProfileStore()

  const [form, setForm] = useState<DoctorProfileDetails>(() =>
    normalizeDoctorProfile(profile),
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    if (isOpen) {
      setForm(normalizeDoctorProfile(profile))
      setAvatarFile(null)
      clearError()
    }
  }, [isOpen, profile, clearError])

  const updateField = <K extends keyof DoctorProfileDetails>(
    key: K,
    value: DoctorProfileDetails[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const availability = form.availability ?? []

    if (availability.length === 0) {
      toast.error("Add at least one availability slot.")
      return
    }

    const uniqueDays = new Set(availability.map((s) => s.dayOfWeek))
    if (uniqueDays.size !== availability.length) {
      toast.error("Each day can only have one availability slot.")
      return
    }

    for (const slot of availability) {
      if (slot.startTime >= slot.endTime) {
        toast.error(
          `End time must be after start time for ${getDayLabel(slot.dayOfWeek)}.`,
        )
        return
      }
    }

    try {
      const savedProfile = await saveProfile(form, avatarFile)
      setForm(savedProfile)
      setAvatarFile(null)

      if (isFirstLogin) {
        await completeFirstLogin()
        toast.success("Profile completed! You can now use Konsultify.")
      } else {
        toast.success("Profile updated successfully.")
      }
      closeProfile()
    } catch {
      toast.error(
        useDoctorProfileStore.getState().error ??
          "Could not save profile. Please try again.",
      )
    }
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
  const email = user?.email ?? ""
  const dialogOpen = isOpen || isFirstLogin

  const handleDismiss = () => {
    if (!isFirstLogin) closeProfile()
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent
        className="max-w-xl p-0"
        showCloseButton={!isFirstLogin}
        onInteractOutside={(e) => isFirstLogin && e.preventDefault()}
        onEscapeKeyDown={(e) => isFirstLogin && e.preventDefault()}
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 bg-gradient-to-br from-sky-50/80 to-white">
            <ProfileAvatarPicker
              avatarUrl={form.avatarUrl}
              displayName={displayName}
              email={email}
              onChange={(url, file) => {
                updateField("avatarUrl", url)
                setAvatarFile(file)
              }}
            />

            <DialogDescription className="text-center">
              {isFirstLogin
                ? "Welcome! Complete your profile to start using Konsultify."
                : "Manage your professional profile visible to patients."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FieldGroup className="gap-8">
              <Field className="gap-2">
                <FieldLabel htmlFor="bio">Bio</FieldLabel>
                <Textarea
                  id="bio"
                  placeholder="e.g. Specialized doctor in internal medicine with 10 years of experience"
                  value={form.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  className={`${textareaClassName} min-h-0 w-full py-2 text-sm`}
                  rows={2}
                />
              </Field>

              <FieldSet className="gap-4">
                <FieldLegend className="sr-only">Account information</FieldLegend>
                <SectionHeading
                  icon={UserIcon}
                  title="Account"
                  description="From your registration — contact support to change these."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field className="gap-2">
                    <FieldLabel htmlFor="firstName">First name</FieldLabel>
                    <Input
                      id="firstName"
                      value={user?.firstName ?? ""}
                      readOnly
                      className={readOnlyClassName}
                      aria-readonly
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                    <Input
                      id="lastName"
                      value={user?.lastName ?? ""}
                      readOnly
                      className={readOnlyClassName}
                      aria-readonly
                    />
                  </Field>
                </div>
                <Field className="gap-2">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email ?? ""}
                    readOnly
                    className={readOnlyClassName}
                    aria-readonly
                  />
                </Field>
              </FieldSet>

              <FieldSet className="gap-4">
                <FieldLegend className="sr-only">Profile details</FieldLegend>
                <SectionHeading
                  icon={StethoscopeIcon}
                  title="Profile details"
                  description="Your credentials and practice information for patients."
                />
                <Field className="gap-2">
                  <FieldLabel htmlFor="education">Education</FieldLabel>
                  <Input
                    id="education"
                    placeholder="e.g. MD, University of the Philippines"
                    value={form.education}
                    onChange={(e) => updateField("education", e.target.value)}
                    className={inputClassName}
                    required
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field className="gap-2">
                    <FieldLabel htmlFor="yearsOfExperience">
                      Years of experience
                    </FieldLabel>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      min={0}
                      max={80}
                      step={1}
                      placeholder="e.g. 10"
                      value={form.yearsOfExperience}
                      onChange={(e) =>
                        updateField("yearsOfExperience", e.target.value)
                      }
                      className={inputClassName}
                      required
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="specialization">Specialization</FieldLabel>
                    <Input
                      id="specialization"
                      placeholder="e.g. Internal Medicine"
                      value={form.specialization}
                      onChange={(e) =>
                        updateField("specialization", e.target.value)
                      }
                      className={inputClassName}
                      required
                    />
                  </Field>
                </div>
                <Field className="gap-2">
                  <FieldLabel htmlFor="consultationFee">
                    Consultation fee (₱)
                  </FieldLabel>
                  <Input
                    id="consultationFee"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="e.g. 1500"
                    value={form.consultationFee}
                    onChange={(e) =>
                      updateField("consultationFee", e.target.value)
                    }
                    className={inputClassName}
                    required
                  />
                  <FieldDescription>
                    Standard fee per consultation shown to patients.
                  </FieldDescription>
                </Field>
              </FieldSet>

              <FieldSet className="gap-4">
                <FieldLegend className="sr-only">Availability</FieldLegend>
                <SectionHeading
                  icon={CalendarClockIcon}
                  title="Availability"
                  description="Add your weekly schedule so patients know when to book."
                />
                <AvailabilityEditor
                  slots={form.availability ?? []}
                  onChange={(availability) =>
                    updateField("availability", availability)
                  }
                />
              </FieldSet>
            </FieldGroup>
          </div>

          <DialogFooter className={isFirstLogin ? "sm:justify-center" : undefined}>
            {!isFirstLogin ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-slate-200"
                onClick={closeProfile}
                disabled={isLoading}
              >
                Cancel
              </Button>
            ) : null}
            <Button
              type="submit"
              className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
              disabled={isLoading}
            >
              {isLoading
                ? "Saving…"
                : isFirstLogin
                  ? "Complete profile"
                  : "Save profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DoctorProfileModal
