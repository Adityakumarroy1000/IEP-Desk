import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import Analyzer from "./pages/Analyzer.jsx";
import Rights from "./pages/Rights.jsx";
import MeetingPrep from "./pages/MeetingPrep.jsx";
import Documents from "./pages/Documents.jsx";
import Settings from "./pages/Settings.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminUsers from "./admin/AdminUsers.jsx";
import AdminAnalyses from "./admin/AdminAnalyses.jsx";
import AdminSettings from "./admin/AdminSettings.jsx";
import { useAuth } from "./hooks/useAuth.js";
import Spinner from "./components/ui/Spinner.jsx";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6"><Spinner label="Checking auth" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, profile, profileLoading } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (profileLoading) return <div className="p-6"><Spinner label="Checking admin" /></div>;
  if (profile?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/analyzer" element={<RequireAuth><Analyzer /></RequireAuth>} />
      <Route path="/rights" element={<RequireAuth><Rights /></RequireAuth>} />
      <Route path="/meeting-prep" element={<RequireAuth><MeetingPrep /></RequireAuth>} />
      <Route path="/documents" element={<RequireAuth><Documents /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

      <Route path="/admin" element={<RequireAuth><RequireAdmin><AdminDashboard /></RequireAdmin></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAuth><RequireAdmin><AdminUsers /></RequireAdmin></RequireAuth>} />
      <Route path="/admin/analyses" element={<RequireAuth><RequireAdmin><AdminAnalyses /></RequireAdmin></RequireAuth>} />
      <Route path="/admin/settings" element={<RequireAuth><RequireAdmin><AdminSettings /></RequireAdmin></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
