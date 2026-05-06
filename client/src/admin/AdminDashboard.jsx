import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useApi } from "../hooks/useApi.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const asArray = (value) => (Array.isArray(value) ? value : []);

export default function AdminDashboard() {
  const api = useApi();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const safeStats = stats || {};

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const data = await api.get("/admin/stats");
        setStats(data);
      } catch (err) {
        setError(err?.message || "Failed to load admin stats.");
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Admin Dashboard">
        {loading ? <Spinner label="Loading stats" /> : (
          <div className="grid gap-6">
            {error && (
              <Card className="border-red-200 bg-red-50">
                <p className="text-sm text-red-700">{error}</p>
              </Card>
            )}
            <div className="grid gap-4 md:grid-cols-4">
              <Card><div className="text-sm text-gray-500">Total Users</div><div className="text-2xl font-bold">{safeStats.totalUsers ?? 0}</div></Card>
              <Card><div className="text-sm text-gray-500">Total Analyses</div><div className="text-2xl font-bold">{safeStats.totalAnalyses ?? 0}</div></Card>
              <Card><div className="text-sm text-gray-500">Today Signups</div><div className="text-2xl font-bold">{safeStats.todaySignups ?? 0}</div></Card>
              <Card><div className="text-sm text-gray-500">Active This Week</div><div className="text-2xl font-bold">{safeStats.activeThisWeek ?? 0}</div></Card>
            </div>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Signups (Last 30 Days)</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={asArray(safeStats.signupsByDay)}>
                    <XAxis dataKey="date" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563EB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Recent Signups</h3>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {asArray(safeStats.recentUsers).map((u) => (
                  <div key={u._id} className="flex items-center justify-between">
                    <span>{u.name} • {u.email}</span>
                    <span className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
