import { useCallback, useEffect, useRef, useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  emptyPrescriptionItem,
  savePrescription,
  type PrescriptionItem,
} from "@/lib/prescription"
import { cn } from "@/lib/utils"

interface PrescriptionItemRow extends PrescriptionItem {
  id: string
}

function createPrescriptionRow(): PrescriptionItemRow {
  return { id: crypto.randomUUID(), ...emptyPrescriptionItem() }
}

function RxLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-50",
        className,
      )}
      aria-hidden
    >
      <span className="font-serif text-xl font-bold leading-none text-emerald-700">
        ℞
      </span>
    </div>
  )
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "")
}

interface MedicineCardProps {
  item: PrescriptionItemRow
  index: number
  canRemove: boolean
  onUpdate: (id: string, key: keyof PrescriptionItem, value: string) => void
  onRemove: (id: string) => void
}

function MedicineCard({
  item,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: MedicineCardProps) {
  const inputClassName =
    "h-9 rounded-lg border-slate-200 bg-white text-sm focus-visible:border-sky-300 focus-visible:ring-sky-200/60"

  return (
    <Card className="shrink-0 gap-0 border-slate-200 bg-slate-50/50 py-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 px-3 py-2.5">
        <CardTitle className="text-sm font-semibold text-slate-800">
          Medicine {index + 1}
        </CardTitle>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(item.id)}
            className="size-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove medicine ${index + 1}`}
          >
            <Trash2Icon className="size-4" />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-3 py-3">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${item.id}-medicine_name`}
            className="text-xs font-medium text-slate-600"
          >
            Medicine name
          </Label>
          <Input
            id={`${item.id}-medicine_name`}
            value={item.medicine_name}
            onChange={(e) => onUpdate(item.id, "medicine_name", e.target.value)}
            placeholder="e.g. Amoxicillin"
            className={inputClassName}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label
              htmlFor={`${item.id}-dosage`}
              className="text-xs font-medium text-slate-600"
            >
              Dosage (mg)
            </Label>
            <Input
              id={`${item.id}-dosage`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={item.dosage}
              onChange={(e) =>
                onUpdate(item.id, "dosage", digitsOnly(e.target.value))
              }
              placeholder="500"
              className={inputClassName}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label
              htmlFor={`${item.id}-frequency`}
              className="text-xs font-medium text-slate-600"
            >
              Frequency (/day)
            </Label>
            <Input
              id={`${item.id}-frequency`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={item.frequency}
              onChange={(e) =>
                onUpdate(item.id, "frequency", digitsOnly(e.target.value))
              }
              placeholder="3"
              className={inputClassName}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label
              htmlFor={`${item.id}-duration`}
              className="text-xs font-medium text-slate-600"
            >
              Duration (days)
            </Label>
            <Input
              id={`${item.id}-duration`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={item.duration}
              onChange={(e) =>
                onUpdate(item.id, "duration", digitsOnly(e.target.value))
              }
              placeholder="7"
              className={inputClassName}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${item.id}-instructions`}
            className="text-xs font-medium text-slate-600"
          >
            Notes
          </Label>
          <Textarea
            id={`${item.id}-instructions`}
            value={item.instructions}
            onChange={(e) =>
              onUpdate(item.id, "instructions", e.target.value)
            }
            placeholder="e.g. Take after meals"
            className="min-h-14 resize-none rounded-lg border-slate-200 bg-white text-sm"
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface PrescriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: number
}

export function PrescriptionDialog({
  open,
  onOpenChange,
  appointmentId,
}: PrescriptionDialogProps) {
  const [items, setItems] = useState<PrescriptionItemRow[]>([
    createPrescriptionRow(),
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setItems([createPrescriptionRow()])
    }
  }, [open])

  const updateItem = (
    id: string,
    key: keyof PrescriptionItem,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    )
  }

  const addItem = () => {
    setItems((prev) => [...prev, createPrescriptionRow()])
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((item) => item.id !== id)
    })
  }

  const handleSubmit = useCallback(async () => {
    const validItems = items.filter((item) => item.medicine_name.trim())

    if (validItems.length === 0) {
      toast.error("Add at least one medicine with a name.")
      return
    }

    setIsSubmitting(true)
    try {
      await savePrescription(
        appointmentId,
        validItems.map(({ id: _id, ...rest }) => rest),
      )
      toast.success("Prescription saved")
      onOpenChange(false)
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? String(
            err.response?.data?.message ??
              err.response?.data?.error ??
              "Could not save prescription",
          )
        : "Could not save prescription"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [appointmentId, items, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-slate-900/20 backdrop-blur-none"
        className={cn(
          "fixed top-1/2 left-1/2 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden p-0",
          "max-h-[min(90dvh,680px)] sm:max-w-md",
        )}
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-slate-100 px-4 py-4">
          <div className="flex items-start gap-3 pr-8">
            <RxLogo />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base">Prescription</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                Add medicines for this appointment. Scroll to see all items.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
        >
          <div className="flex flex-col gap-3">
            {items.map((item, index) => (
              <MedicineCard
                key={item.id}
                item={item}
                index={index}
                canRemove={items.length > 1}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="h-9 shrink-0 rounded-xl border-dashed border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <PlusIcon className="size-4" />
              Add another prescription
            </Button>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 px-4 py-3 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl text-sm"
          >
            Skip for now
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              handleSubmit().catch(() => undefined)
            }}
            className="h-9 rounded-xl bg-emerald-600 text-sm text-white hover:bg-emerald-700"
          >
            {isSubmitting ? "Saving…" : "Save prescription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
