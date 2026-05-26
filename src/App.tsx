import { Navigate, Route, Routes } from "react-router";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";

function App() {
  return (
    <Routes>
      {/* Marketing landing page (hero, features, FAQ, etc.) */}
      <Route path="/" element={<LandingPage />} />
      {/* Dedicated login page */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      {/* Unknown paths → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
