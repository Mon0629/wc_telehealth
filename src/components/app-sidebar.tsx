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
import logo from "@/assets/vite.svg"

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
  const { user } = useAuthStore()

  const isDoctor = user?.role === "DOCTOR"
  const navItems = isDoctor ? doctorNav : patientNav

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : "Guest"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <img src={logo} alt="Konsultify" className="size-5" />
                </div>
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
            avatar: "",
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
