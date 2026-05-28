import { useEffect, useRef, useState } from "react"
import {
  CameraIcon,
  StethoscopeIcon,
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
import useAuthStore from "@/store/authStore"
import useDoctorProfileStore, {
  type DoctorProfileDetails,
} from "@/store/doctorProfileStore"

const inputClassName =
  "h-11 rounded-xl border-sky-100 bg-sky-50/50 px-4 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"

const readOnlyClassName =
  "h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-50 px-4 text-slate-600"

const textareaClassName =
  "resize-none rounded-xl border-sky-100 bg-sky-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"

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
      {avatarUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 rounded-full text-slate-500 hover:text-slate-900"
          onClick={() => onChange("")}
        >
          Remove photo
        </Button>
      ) : null}
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

export function DoctorProfileModal() {
  const { user } = useAuthStore()
  const { isOpen, closeProfile, profile, setProfile } = useDoctorProfileStore()

  const [form, setForm] = useState<DoctorProfileDetails>(profile)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...profile,
        avatarUrl: profile.avatarUrl ?? "",
      })
    }
  }, [isOpen, profile])

  const updateField = <K extends keyof DoctorProfileDetails>(
    key: K,
    value: DoctorProfileDetails[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      setProfile(form)
      toast.success("Profile updated successfully.")
      closeProfile()
    } finally {
      setIsSaving(false)
    }
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
  const email = user?.email ?? ""

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeProfile()}>
      <DialogContent className="max-w-xl p-0" showCloseButton>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 bg-gradient-to-br from-sky-50/80 to-white">
            <ProfileAvatarPicker
              avatarUrl={form.avatarUrl}
              displayName={displayName}
              email={email}
              onChange={(url) => updateField("avatarUrl", url)}
            />

            <DialogDescription className="text-center">
              Manage your professional profile visible to patients.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FieldGroup className="gap-8">
              <Field className="gap-2">
                <Textarea
                  id="bio"
                  placeholder='Bio: e.g. Specialized doctor in internal medicine with 10 years of experience'
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
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-slate-200"
              onClick={closeProfile}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DoctorProfileModal
