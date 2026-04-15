import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { DIAGNOSES, GRADES, STATES } from "../utils/constants.js";
import { useApi } from "../hooks/useApi.js";
import { useProfile } from "../hooks/useProfile.js";

const initialForm = {
  childName: "",
  dateOfBirth: "",
  grade: "",
  school: "",
  schoolDistrict: "",
  state: "",
  diagnoses: [],
  planType: "IEP",
  notes: ""
};

const FERPA_NOTICE = "FERPA notice: This page contains student educational records. Only share information you have permission to use.";

export default function Profile() {
  const api = useApi();
  const { profiles, setProfiles, setActiveProfileId } = useProfile();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get("/profile");
        setProfiles(data || []);
      } catch (err) {
        setMessageType("error");
        setMessage(err?.message || "Failed to load profiles.");
      }
    };
    load();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDiagnosis = (diag) => {
    setForm((prev) => {
      const exists = prev.diagnoses.includes(diag);
      return {
        ...prev,
        diagnoses: exists ? prev.diagnoses.filter((d) => d !== diag) : [...prev.diagnoses, diag]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const missing = [];
      if (!form.childName?.trim()) missing.push("child name");
      if (!form.grade?.trim()) missing.push("grade");
      if (!form.state?.trim()) missing.push("state");
      if (missing.length) {
        setMessageType("error");
        setMessage(`Please provide: ${missing.join(", ")}.`);
        return;
      }
      const payload = { ...form };
      let result;
      if (editingId) {
        result = await api.put(`/profile/${editingId}`, payload);
      } else {
        result = await api.post("/profile", payload);
      }
      setMessageType("success");
      setMessage("Profile saved successfully.");
      const data = await api.get("/profile");
      setProfiles(data || []);
      setActiveProfileId(result?._id || editingId);
      setForm(initialForm);
      setEditingId(null);
    } catch (err) {
      setMessageType("error");
      setMessage(err?.message || "Failed to save profile.");
    }
  };

  const startEdit = (profile) => {
    setEditingId(profile._id);
    setForm({
      childName: profile.childName || "",
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
      grade: profile.grade || "",
      school: profile.school || "",
      schoolDistrict: profile.schoolDistrict || "",
      state: profile.state || "",
      diagnoses: profile.diagnoses || [],
      planType: profile.planType || "IEP",
      notes: profile.notes || ""
    });
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Child Profile">
        <div className="grid gap-6">
          <Card className="border-primary/20 bg-white/90">
            <div className="text-sm text-gray-600">
              Build one profile per child so analysis, rights, and meeting prep are personalized.
            </div>
            <div className="mt-2 text-xs text-gray-400">{FERPA_NOTICE}</div>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-gray-800">Existing Profiles</h3>
            <div className="mt-4 grid gap-2 text-sm text-gray-600">
              {profiles?.length ? profiles.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                  <div>
                    <div className="font-semibold text-gray-800">{p.childName}</div>
                    <div className="text-xs text-gray-500">{p.grade} - {p.state}</div>
                  </div>
                  <Button variant="ghost" onClick={() => startEdit(p)}>Edit</Button>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No profiles yet.</p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-800">{editingId ? "Edit" : "Create"} Profile</h3>
            <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
              <Input label="Child Name" value={form.childName} onChange={(e) => handleChange("childName", e.target.value)} required />
              <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => handleChange("dateOfBirth", e.target.value)} />
              <label className="block text-sm text-gray-700">
                <span className="mb-2 block text-sm text-gray-600">Grade</span>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={form.grade} onChange={(e) => handleChange("grade", e.target.value)} required>
                  <option value="">Select grade</option>
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <Input label="School" value={form.school} onChange={(e) => handleChange("school", e.target.value)} />
              <Input label="School District" value={form.schoolDistrict} onChange={(e) => handleChange("schoolDistrict", e.target.value)} />
              <label className="block text-sm text-gray-700">
                <span className="mb-2 block text-sm text-gray-600">State</span>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={form.state} onChange={(e) => handleChange("state", e.target.value)} required>
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <div>
                <span className="mb-2 block text-sm text-gray-600">Diagnoses</span>
                <div className="flex flex-wrap gap-2">
                  {DIAGNOSES.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleDiagnosis(d)}
                      className={`rounded-full border px-3 py-1 text-xs ${form.diagnoses.includes(d) ? "border-primary bg-primary-light text-primary" : "border-gray-200 text-gray-500"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block text-sm text-gray-700">
                <span className="mb-2 block text-sm text-gray-600">Plan Type</span>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={form.planType} onChange={(e) => handleChange("planType", e.target.value)}>
                  {["IEP", "504", "Both", "None"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label className="block text-sm text-gray-700">
                <span className="mb-2 block text-sm text-gray-600">Notes</span>
                <textarea className="w-full rounded-lg border border-gray-300 px-4 py-3" rows="4" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} />
              </label>
              {message && (
                <div className={`rounded-lg border p-3 text-xs ${messageType === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"}`}>
                  {message}
                </div>
              )}
              <Button type="submit">Save Profile</Button>
            </form>
          </Card>
        </div>
      </PageWrapper>
    </div>
  );
}
