import * as React from "react"
import {
  LayoutDashboardIcon,
  SearchIcon,
  CalendarIcon,
  FileTextIcon,
  UsersIcon,
  CalendarCheckIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import useAuthStore from "@/store/authStore"
import usePatientProfileStore from "@/store/patientProfileStore"
import useDoctorProfileStore from "@/store/doctorProfileStore"
import { PatientProfileModal } from "@/pages/patient/patient-profile"
import { DoctorProfileModal } from "@/pages/doctor/doctor-profile"
import logo from "@/assets/konsultify-logo.png"

const patientNav = [
  {
    title: "Dashboard",
    url: "/patient-dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Doctor Discovery",
    url: "/patient/doctor-discovery",
    icon: <SearchIcon />,
  },
  {
    title: "My Appointments",
    url: "/patient/appointments",
    icon: <CalendarIcon />,
  },
  {
    title: "Medical Records",
    url: "/patient/medical-records",
    icon: <FileTextIcon />,
  },
]

const doctorNav = [
  {
    title: "Dashboard",
    url: "/doctor-dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Patients",
    url: "/doctor/patients",
    icon: <UsersIcon />,
  },
  {
    title: "Appointments",
    url: "/doctor/appointments",
    icon: <CalendarCheckIcon />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isFirstLogin } = useAuthStore()
  const openPatientProfile = usePatientProfileStore((s) => s.openProfile)
  const patientAvatarUrl = usePatientProfileStore((s) => s.profile.avatarUrl)
  const openDoctorProfile = useDoctorProfileStore((s) => s.openProfile)
  const doctorAvatarUrl = useDoctorProfileStore((s) => s.profile.avatarUrl)

  const isDoctor = user?.role === "DOCTOR"
  const navItems = isDoctor ? doctorNav : patientNav
  const notificationsPath = isDoctor
    ? "/doctor/notifications"
    : "/patient/notifications"

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : "Guest"

  React.useEffect(() => {
    if (!isFirstLogin) return
    if (isDoctor) {
      openDoctorProfile()
    } else {
      openPatientProfile()
    }
  }, [isFirstLogin, isDoctor, openDoctorProfile, openPatientProfile])

  return (
    <>
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className="flex items-center gap-2">
                <img
                  src={logo}
                  alt="Konsultify"
                  className="size-8 shrink-0 rounded-lg object-contain"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Konsultify</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {isDoctor ? "Doctor Portal" : "Patient Portal"}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} groupLabel={isDoctor ? "Doctor" : "Patient"} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: displayName,
            email: user?.email ?? "",
            avatar: isDoctor ? doctorAvatarUrl : patientAvatarUrl,
          }}
          notificationsPath={notificationsPath}
          onAccountClick={isDoctor ? openDoctorProfile : openPatientProfile}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
    {isDoctor ? <DoctorProfileModal /> : <PatientProfileModal />}
    </>
  )
}
