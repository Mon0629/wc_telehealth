import React from 'react'
import { SidebarTrigger } from "@/components/ui/sidebar";

const PatientDoctorDiscovery = () => {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 items-center gap-2 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-slate-700">Doctor Discovery</span>
      </header>
    </div>
  )
}

export default PatientDoctorDiscovery