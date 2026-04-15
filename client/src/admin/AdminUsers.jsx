import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { useApi } from "../hooks/useApi.js";

export default function AdminUsers() {
  const api = useApi();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  const load = async () => {
    const data = await api.get(`/admin/users?search=${encodeURIComponent(query)}`);
    setUsers(data || []);
  };

  useEffect(() => { load(); }, []);

  const updateUser = async (id, patch) => {
    await api.put(`/admin/users/${id}`, patch);
    load();
  };

  const deleteUser = async (id) => {
    await api.del(`/admin/users/${id}`);
    load();
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Admin Users">
        <Card>
          <div className="flex items-center justify-between">
            <Input label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button variant="ghost" onClick={load}>Search</Button>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            {users.map((u) => (
              <div key={u._id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <div className="font-semibold text-gray-800">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email} • {u.plan} • {u.role}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => updateUser(u._id, { role: u.role === "admin" ? "user" : "admin" })}>Toggle Role</Button>
                  <Button variant="ghost" onClick={() => updateUser(u._id, { plan: u.plan === "free" ? "beta" : "free" })}>Toggle Plan</Button>
                  <Button variant="danger" onClick={() => deleteUser(u._id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </PageWrapper>
    </div>
  );
}
