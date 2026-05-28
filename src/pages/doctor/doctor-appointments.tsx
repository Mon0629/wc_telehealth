import React from 'react'
import { SidebarTrigger } from "@/components/ui/sidebar";

const DoctorAppointments = () => {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 items-center gap-2 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-slate-700">My Appointments</span>
      </header>
    </div>
  )
}

export default DoctorAppointments