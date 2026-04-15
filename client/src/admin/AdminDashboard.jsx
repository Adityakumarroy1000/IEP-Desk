import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useApi } from "../hooks/useApi.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const api = useApi();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await api.get("/admin/stats");
      setStats(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Admin Dashboard">
        {loading ? <Spinner label="Loading stats" /> : (
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card><div className="text-sm text-gray-500">Total Users</div><div className="text-2xl font-bold">{stats.totalUsers}</div></Card>
              <Card><div className="text-sm text-gray-500">Total Analyses</div><div className="text-2xl font-bold">{stats.totalAnalyses}</div></Card>
              <Card><div className="text-sm text-gray-500">Today Signups</div><div className="text-2xl font-bold">{stats.todaySignups}</div></Card>
              <Card><div className="text-sm text-gray-500">Active This Week</div><div className="text-2xl font-bold">{stats.activeThisWeek}</div></Card>
            </div>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Signups (Last 30 Days)</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.signupsByDay || []}>
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
                {stats.recentUsers?.map((u) => (
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
