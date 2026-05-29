import { Navigate, Outlet, Route, Routes } from "react-router";
import LandingPage from "@/pages/landing-page";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import RoleSelector from "@/pages/auth/role-seletor";
import EmailVerification from "@/pages/auth/email-verification";
import VerificationSuccess from "@/pages/auth/verification-success";
import PatientDashboard from "@/pages/patient/patient-dashboard";
import DoctorDashboard from "@/pages/doctor/doctor-dashboard";
import { AppSidebar } from "@/components/app-sidebar";
import DoctorDiscovery from "@/pages/patient/patient-doctor-discovery"
import MyAppointments from "@/pages/patient/patient-appointments";
import MyMedicalRecords from "@/pages/patient/patient-medical-records";
import DoctorAppointments from "@/pages/doctor/doctor-appointments";
import DoctorPatients from "@/pages/doctor/doctor-patients";
import NotificationsPage from "@/pages/notifications";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import useAuthStore from "@/store/authStore";
import VideoCallPage from "@/pages/video-call";
import { SocketNotificationProvider } from "@/components/SocketNotificationProvider";

function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SocketNotificationProvider>
      <Outlet />
    </SocketNotificationProvider>
  );
}

function ProtectedLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SocketNotificationProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </SocketNotificationProvider>
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
      <Route path="/verification-success" element={<VerificationSuccess />} />

      <Route element={<AuthLayout />}>
        <Route path="/call/:appointmentId" element={<VideoCallPage />} />
      </Route>

      <Route element={<ProtectedLayout />}>
        <Route element={<RoleGuard allowed="PATIENT" />}>
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/patient/doctor-discovery" element={<DoctorDiscovery />} />
          <Route path="/patient/appointments" element={<MyAppointments />} />
          <Route path="/patient/medical-records" element={<MyMedicalRecords />} />
          <Route path="/patient/notifications" element={<NotificationsPage />} />
        </Route>

        <Route element={<RoleGuard allowed="DOCTOR" />}>
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
