import { useEffect, useRef, useState } from "react"
import { CameraIcon, HeartPulseIcon, MapPinIcon, UserIcon } from "lucide-react"
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
  DialogTitle,
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
import useAuthStore from "@/store/authStore"
import usePatientProfileStore, {
  type PatientProfileDetails,
} from "@/store/patientProfileStore"

const inputClassName =
  "h-11 rounded-xl border-sky-100 bg-sky-50/50 px-4 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"

const readOnlyClassName =
  "h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-50 px-4 text-slate-600"

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]

function getInitials(name: string, email: string): string {
  const fromName = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
  return fromName || email.slice(0, 2).toUpperCase()
}

function ProfileAvatarPicker({
  avatarUrl,
  displayName,
  email,
  onChange,
}: {
  avatarUrl: string
  displayName: string
  email: string
  onChange: (url: string) => void
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
        onChange(reader.result)
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
      <div className="flex flex-wrap justify-center gap-2">
        {avatarUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full text-slate-500 hover:text-slate-900"
            onClick={() => onChange("")}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  )
}

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
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
        <Icon className="size-4" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}

export function PatientProfileModal() {
  const { user, isFirstLogin, completeFirstLogin } = useAuthStore()
  const { isOpen, closeProfile, profile, setProfile } = usePatientProfileStore()

  const [form, setForm] = useState<PatientProfileDetails>(profile)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...profile,
        avatarUrl: profile.avatarUrl ?? "",
        phone: profile.phone || user?.phone || "",
      })
    }
  }, [isOpen, profile, user?.phone])

  const updateField = <K extends keyof PatientProfileDetails>(
    key: K,
    value: PatientProfileDetails[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      setProfile(form)
      if (isFirstLogin) {
        completeFirstLogin()
        toast.success("Profile completed! You can now use Konsultify.")
      } else {
        toast.success("Profile updated successfully.")
      }
      closeProfile()
    } finally {
      setIsSaving(false)
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
              onChange={(url) => updateField("avatarUrl", url)}
            />
            <DialogDescription className="text-center mt-4">
              {isFirstLogin
                ? "Welcome! Complete your profile to start using Konsultify."
                : "Keep your health and contact details up to date for better care."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FieldGroup className="gap-8">
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
                <FieldLegend className="sr-only">Personal details</FieldLegend>
                <SectionHeading
                  icon={UserIcon}
                  title="Personal details"
                  description="Basic information for your health record."
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field className="gap-2 sm:col-span-1">
                    <FieldLabel htmlFor="birthday">Birthday</FieldLabel>
                    <Input
                      id="birthday"
                      type="date"
                      value={form.birthday}
                      onChange={(e) => updateField("birthday", e.target.value)}
                      className={inputClassName}
                      required
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="weight">Weight (kg)</FieldLabel>
                    <Input
                      id="weight"
                      type="number"
                      min={1}
                      max={500}
                      step={0.1}
                      placeholder="e.g. 70"
                      value={form.weightKg}
                      onChange={(e) => updateField("weightKg", e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="height">Height (cm)</FieldLabel>
                    <Input
                      id="height"
                      type="number"
                      min={50}
                      max={300}
                      step={0.1}
                      placeholder="e.g. 175"
                      value={form.heightCm}
                      onChange={(e) => updateField("heightCm", e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                </div>
              </FieldSet>

              <FieldSet className="gap-4">
                <FieldLegend className="sr-only">Contact details</FieldLegend>
                <SectionHeading
                  icon={MapPinIcon}
                  title="Contact details"
                  description="How your care team can reach you."
                />
                <Field className="gap-2">
                  <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={inputClassName}
                    required
                  />
                </Field>
                <Field className="gap-2">
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <Textarea
                    id="address"
                    placeholder="Street, city, province, postal code"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="min-h-[80px] resize-none rounded-xl border-sky-100 bg-sky-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                    required
                  />
                </Field>
              </FieldSet>

              <FieldSet className="gap-4">
                <FieldLegend className="sr-only">Medical history</FieldLegend>
                <SectionHeading
                  icon={HeartPulseIcon}
                  title="Medical history"
                  description="Allergies and conditions linked to your account."
                />
                <Field className="gap-2">
                  <FieldLabel htmlFor="allergies">Allergies</FieldLabel>
                  <Textarea
                    id="allergies"
                    placeholder="e.g. Penicillin, peanuts, latex — or none"
                    value={form.allergies}
                    onChange={(e) => updateField("allergies", e.target.value)}
                    className="min-h-[72px] resize-none rounded-xl border-sky-100 bg-sky-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                  />
                  <FieldDescription>
                    List any known allergies so providers can avoid harmful treatments.
                  </FieldDescription>
                </Field>
                <Field className="gap-2">
                  <FieldLabel htmlFor="conditions">Medical conditions</FieldLabel>
                  <Textarea
                    id="conditions"
                    placeholder="e.g. Asthma, hypertension, diabetes — or none"
                    value={form.conditions}
                    onChange={(e) => updateField("conditions", e.target.value)}
                    className="min-h-[72px] resize-none rounded-xl border-sky-100 bg-sky-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                  />
                  <FieldDescription>
                    Ongoing or past conditions that may affect your care plan.
                  </FieldDescription>
                </Field>
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
                disabled={isSaving}
              >
                Cancel
              </Button>
            ) : null}
            <Button
              type="submit"
              className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
              disabled={isSaving}
            >
              {isSaving
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

export default PatientProfileModal
