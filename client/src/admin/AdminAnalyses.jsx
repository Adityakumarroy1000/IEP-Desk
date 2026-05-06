import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import { useApi } from "../hooks/useApi.js";

const asArray = (value) => (Array.isArray(value) ? value : []);

export default function AdminAnalyses() {
  const api = useApi();
  const [analyses, setAnalyses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const data = await api.get("/admin/analyses");
        setAnalyses(asArray(data?.analyses ?? data));
      } catch (err) {
        setError(err?.message || "Failed to load analyses.");
        setAnalyses([]);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Admin Analyses">
        <Card>
          <div className="space-y-2 text-sm text-gray-600">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</div>}
            {asArray(analyses).map((a) => (
              <div key={a._id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <div className="font-semibold text-gray-800">{a.userEmail} • {a.childName}</div>
                  <div className="text-xs text-gray-500">{a.state} • Score {a.overallScore}</div>
                </div>
                <span className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </PageWrapper>
    </div>
  );
}
