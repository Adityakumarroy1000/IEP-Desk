import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useApi } from "../hooks/useApi.js";
import { useProfile } from "../hooks/useProfile.js";

const TYPES = ["IEP", "504", "Evaluation", "Email", "Meeting Notes", "Other"];
const FERPA_NOTICE = "FERPA notice: This page contains student educational records. Only upload documents you have permission to share.";

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  if (!bytes && bytes !== 0) return "-";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export default function Documents() {
  const api = useApi();
  const { profiles, setProfiles, activeProfileId, setActiveProfileId } = useProfile();
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [type, setType] = useState(TYPES[0]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    const loadProfiles = async () => {
      if (!profiles.length) {
        const data = await api.get("/profile");
        setProfiles(data || []);
        if (data?.length) setActiveProfileId(data[0]._id);
      }
    };
    loadProfiles();
  }, []);

  useEffect(() => {
    const loadDocs = async () => {
      if (activeProfileId) {
        const data = await api.get(`/documents/${activeProfileId}`);
        setDocs(data || []);
      }
    };
    loadDocs();
  }, [activeProfileId]);

  const handleUpload = async () => {
    if (!file || !activeProfileId) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", activeProfileId);
      formData.append("type", type);
      formData.append("name", name || file.name);
      if (date) formData.append("date", date);
      const payload = await api.post("/documents", formData, { headers: {} });
      setDocs((prev) => [payload, ...prev]);
      setFile(null);
      setName("");
      setDate("");
    } finally {
      setLoading(false);
    }
  };

  const deleteDoc = async (id) => {
    await api.del(`/documents/${id}`);
    setDocs((prev) => prev.filter((d) => d._id !== id));
  };

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const matchQuery = d.name?.toLowerCase().includes(query.toLowerCase()) || d.type?.toLowerCase().includes(query.toLowerCase());
      const matchType = typeFilter === "All" ? true : d.type === typeFilter;
      return matchQuery && matchType;
    });
  }, [docs, query, typeFilter]);

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Documents">
        <div className="grid gap-6">
          <Card className="border-primary/20 bg-white/90">
            <div className="grid gap-4">
              <label className="block text-sm text-gray-700">
                <span className="mb-2 block text-sm text-gray-600">Select Profile</span>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={activeProfileId || ""} onChange={(e) => setActiveProfileId(e.target.value)}>
                  <option value="">Select child profile</option>
                  {profiles.map((p) => (
                    <option key={p._id} value={p._id}>{p.childName}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_1fr]">
                <label className="block text-sm text-gray-700">
                  <span className="mb-2 block text-sm text-gray-600">Upload file</span>
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
                  {file && <div className="mt-1 text-xs text-gray-500">{file.name} - {formatBytes(file.size)}</div>}
                </label>
                <label className="block text-sm text-gray-700">
                  <span className="mb-2 block text-sm text-gray-600">Document type</span>
                  <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={type} onChange={(e) => setType(e.target.value)}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <Input label="Document name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button onClick={handleUpload} disabled={loading || !file || !activeProfileId}>
                {loading ? <Spinner label="Uploading" /> : "Upload Document"}
              </Button>
              <p className="text-xs text-gray-400">Supported types: PDF, PNG, JPG. Max size 10MB.</p>
              <p className="text-xs text-gray-400">{FERPA_NOTICE}</p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-800">All Documents</h3>
              <div className="flex flex-wrap gap-2">
                <Input label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
                <label className="block text-sm text-gray-700">
                  <span className="mb-2 block text-sm text-gray-600">Filter</span>
                  <select className="rounded-lg border border-gray-300 px-3 py-2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    {["All", ...TYPES].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-gray-600">
              {filtered?.length ? filtered.map((d) => (
                <div key={d._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white/70 px-3 py-2">
                  <div>
                    <div className="font-semibold text-gray-800">{d.name}</div>
                    <div className="text-xs text-gray-500">{d.type} - {d.date ? new Date(d.date).toLocaleDateString() : "No date"} - {formatBytes(d.fileSize)}</div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <a className="text-primary" href={d.url} target="_blank" rel="noreferrer">View</a>
                    <button className="text-danger" onClick={() => deleteDoc(d._id)}>Delete</button>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No documents uploaded.</p>
              )}
            </div>
          </Card>
        </div>
      </PageWrapper>
    </div>
  );
}
