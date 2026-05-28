import { Navigate, Outlet, Route, Routes } from "react-router";
import LandingPage from "@/pages/landing-page";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import RoleSelector from "@/pages/auth/role-seletor";
import EmailVerification from "@/pages/auth/email-verification";
import PatientDashboard from "@/pages/patient/patient-dashboard";
import DoctorDashboard from "@/pages/doctor/doctor-dashboard";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import useAuthStore from "@/store/authStore";

function ProtectedLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function RoleGuard({ allowed }: { allowed: "PATIENT" | "DOCTOR" }) {
  const { user } = useAuthStore();

  if (user?.role !== allowed) {
    const redirect =
      user?.role === "PATIENT" ? "/patient-dashboard" : "/doctor-dashboard";
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/register" element={<RoleSelector />} />
      <Route path="/email-verification" element={<EmailVerification />} />

      <Route element={<ProtectedLayout />}>
        <Route element={<RoleGuard allowed="PATIENT" />}>
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/patient/doctor-discovery" element={<PatientDashboard />} />
          <Route path="/patient/appointments" element={<PatientDashboard />} />
          <Route path="/patient/medical-records" element={<PatientDashboard />} />
        </Route>

        <Route element={<RoleGuard allowed="DOCTOR" />}>
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/patients" element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<DoctorDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
