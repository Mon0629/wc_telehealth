import { useEffect, useMemo, useState } from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageCircleIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StethoscopeIcon,
  TagIcon,
  XIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import useDoctorStore, { type DoctorListItem } from "@/store/doctorStore"

function formatFee(fee: string) {
  const amount = Number(fee)
  if (Number.isNaN(amount)) return fee
  return `₱${amount.toLocaleString()}`
}

function getInitials(name: string) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// ─── doctor card ──────────────────────────────────────────────────────────────

function DoctorCard({
  doctor,
  isSelected,
  onSelect,
}: {
  doctor: DoctorListItem
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "cursor-pointer gap-0 overflow-visible border-2 bg-white py-0 shadow-sm ring-0 transition-[border-color,box-shadow] hover:shadow-md",
        isSelected ? "border-sky-400" : "border-slate-200",
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="size-16 shrink-0 rounded-xl">
            <AvatarImage
              src={doctor.avatar}
              alt={doctor.name}
              className="rounded-xl object-cover"
            />
            <AvatarFallback className="rounded-xl bg-sky-100 font-semibold text-sky-700">
              {getInitials(doctor.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="space-y-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {doctor.name}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <StethoscopeIcon className="size-3.5 text-slate-400" />
                {doctor.specialization}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <TagIcon className="size-3.5 text-slate-400" />
                {formatFee(doctor.fee)}/appointment
              </div>
            </div>

            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                className="h-7 flex-1 rounded-lg bg-indigo-500 px-2 text-xs font-medium text-white hover:bg-indigo-600"
              >
                Book Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 flex-1 rounded-lg border-slate-200 px-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                onClick={onSelect}
              >
                Detail
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                className="size-7 shrink-0 rounded-lg border-slate-200 text-slate-500"
              >
                <MessageCircleIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DoctorCardSkeleton() {
  return (
    <Card className="gap-0 border-2 border-slate-200 bg-white py-0">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Skeleton className="size-16 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/5" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-7 flex-1 rounded-lg" />
              <Skeleton className="h-7 flex-1 rounded-lg" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── detail panel ─────────────────────────────────────────────────────────────

function DoctorDetailPanel({
  doctor,
  onClose,
}: {
  doctor: DoctorListItem
  onClose: () => void
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 lg:w-[360px] xl:w-[400px]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">
          Detail Doctor
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-5 pt-2 pb-4">
          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="mx-auto aspect-square w-full max-w-[280px] rounded-2xl object-cover"
          />
        </div>

        <div className="space-y-4 px-5 pb-5">
          <div className="space-y-1 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              {doctor.name}
            </h3>
            <div className="flex items-center justify-center gap-1 text-sm text-slate-500">
              <StethoscopeIcon className="size-3.5 text-slate-400" />
              {doctor.specialization}
            </div>
            <div className="flex items-center justify-center gap-1 text-sm text-slate-500">
              <TagIcon className="size-3.5 text-slate-400" />
              {formatFee(doctor.fee)}/appointment
            </div>
          </div>

          {doctor.bio ? (
            <p className="mx-auto max-w-[320px] text-center text-sm leading-relaxed text-slate-500">
              {doctor.bio}
            </p>
          ) : null}

          <div className="space-y-2 text-left">
            {doctor.education ? (
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">Education:</span>{" "}
                {doctor.education}
              </p>
            ) : null}
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-700">Specialization:</span>{" "}
              {doctor.specialization}
            </p>
            {doctor.yearsExperience > 0 ? (
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">Experience:</span>{" "}
                {doctor.yearsExperience} years
              </p>
            ) : null}
          </div>

          {doctor.availabilitySlots.length > 0 ? (
            <section className="text-left">
              <div className="mb-2 flex items-center gap-2">
                <SparklesIcon className="size-4 text-indigo-500" />
                <h4 className="text-sm font-semibold text-slate-800">
                  Availability
                </h4>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-500">
                {doctor.availabilitySlots.map((slot) => (
                  <li key={slot}>{slot}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <div className="flex gap-3 border-t border-slate-100 p-5">
        <Button className="h-10 flex-1 rounded-xl bg-indigo-500 text-sm font-medium text-white hover:bg-indigo-600">
          Book Now
        </Button>
        <Button
          variant="outline"
          className="h-10 flex-1 rounded-xl border-slate-200 text-sm font-medium text-slate-700"
        >
          <MessageCircleIcon className="size-4" />
          Chat
        </Button>
      </div>
    </aside>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

const PatientDoctorDiscovery = () => {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListItem | null>(
    null,
  )

  const { doctors, pagination, isLoading, error, fetchDoctors, clearError } =
    useDoctorStore()

  useEffect(() => {
    fetchDoctors(1, 10).catch(() => undefined)
  }, [fetchDoctors])

  const specializationFilters = useMemo(() => {
    const unique = Array.from(
      new Set(doctors.map((d) => d.specialization).filter(Boolean)),
    ).sort()
    return ["All", ...unique]
  }, [doctors])

  const filtered = useMemo(() => {
    return doctors.filter((doctor) => {
      const query = search.toLowerCase()
      const matchesSearch =
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialization.toLowerCase().includes(query)
      const matchesFilter =
        activeFilter === "All" || doctor.specialization === activeFilter
      return matchesSearch && matchesFilter
    })
  }, [doctors, search, activeFilter])

  const handlePageChange = (page: number) => {
    setSelectedDoctor(null)
    fetchDoctors(page, pagination?.limit ?? 10).catch(() => undefined)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 items-center gap-2 border-b border-slate-100 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-slate-700">
          Doctor Discovery
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-5 lg:flex-row lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-lg font-semibold text-slate-800">
              Doctor List
            </h1>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search Doctor"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 rounded-xl border-slate-200 bg-white pl-9 text-sm placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                />
              </div>
              <Button
                variant="outline"
                className="h-9 shrink-0 gap-1.5 rounded-xl border-slate-200 px-3 text-sm text-slate-600"
              >
                <SlidersHorizontalIcon className="size-4" />
                Filter
                <ChevronDownIcon className="size-3.5 opacity-60" />
              </Button>
            </div>
          </div>

          {specializationFilters.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {specializationFilters.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFilter(tab)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    activeFilter === tab
                      ? "bg-indigo-500 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-indigo-50",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-700 hover:bg-red-100"
                onClick={() => {
                  clearError()
                  fetchDoctors(
                    pagination?.page ?? 1,
                    pagination?.limit ?? 10,
                  ).catch(() => undefined)
                }}
              >
                Retry
              </Button>
            </div>
          ) : null}

          {isLoading ? (
            <div
              className={cn(
                "grid grid-cols-1 gap-3 p-0.5",
                selectedDoctor ? "md:grid-cols-2" : "md:grid-cols-3",
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <div
                className={cn(
                  "grid grid-cols-1 gap-3 p-0.5",
                  selectedDoctor ? "md:grid-cols-2" : "md:grid-cols-3",
                )}
              >
                {filtered.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    isSelected={selectedDoctor?.id === doctor.id}
                    onSelect={() => setSelectedDoctor(doctor)}
                  />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 ? (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500">
                    Page {pagination.page} of {pagination.totalPages} ·{" "}
                    {pagination.total} doctor
                    {pagination.total !== 1 ? "s" : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage || isLoading}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className="h-8 gap-1 rounded-lg"
                    >
                      <ChevronLeftIcon className="size-4" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage || isLoading}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="h-8 gap-1 rounded-lg"
                    >
                      Next
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-sky-50">
                <SearchIcon className="size-6 text-sky-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No doctors found
              </p>
              <p className="text-xs text-slate-400">
                Try adjusting your search or filter
              </p>
            </div>
          )}
        </div>

        {selectedDoctor ? (
          <DoctorDetailPanel
            doctor={selectedDoctor}
            onClose={() => setSelectedDoctor(null)}
          />
        ) : null}
      </div>
    </div>
  )
}

export default PatientDoctorDiscovery
