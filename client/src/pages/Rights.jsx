import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useApi } from "../hooks/useApi.js";
import { useProfile } from "../hooks/useProfile.js";

const FERPA_NOTICE = "FERPA notice: This page contains student educational records. Only share information you have permission to use.";

export default function Rights() {
  const api = useApi();
  const { profiles, setProfiles, activeProfileId, setActiveProfileId } = useProfile();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!profiles.length) {
        const data = await api.get("/profile");
        setProfiles(data || []);
        if (data?.length) setActiveProfileId(data[0]._id);
      }
    };
    load();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const payload = await api.post("/rights", { profileId: activeProfileId });
      setResult(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Your Legal Rights">
        <Card className="border-primary/20 bg-white/90">
          <div className="grid gap-4">
            <label className="block text-sm text-gray-700">
              <span className="mb-2 block text-sm text-gray-600">Select Profile</span>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={activeProfileId || ""} onChange={(e) => setActiveProfileId(e.target.value)}>
                <option value="">Select child profile</option>
                {profiles.map((p) => (
                  <option key={p._id} value={p._id}>{p.childName} - {p.state}</option>
                ))}
              </select>
            </label>
            <Button onClick={handleGenerate} disabled={!activeProfileId || loading}>
              {loading ? <Spinner label="Generating rights" /> : "Show My Rights"}
            </Button>
            <p className="text-xs text-gray-400">{FERPA_NOTICE}</p>
          </div>
        </Card>

        {result && (
          <div className="mt-6 grid gap-4">
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Federal Rights</h3>
              <div className="mt-3 grid gap-3">
                {result.federalRights?.map((item, idx) => (
                  <details key={idx} className="rounded-lg border border-gray-200 bg-white/70 p-3">
                    <summary className="cursor-pointer font-semibold text-gray-700">{item.right}</summary>
                    <div className="mt-2 text-sm text-gray-600">{item.description}</div>
                    <div className="mt-1 text-xs text-gray-500">How to request: {item.howToRequest}</div>
                  </details>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Common Accommodations</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {result.commonAccommodations?.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 bg-white/70 p-3 text-sm">
                    <div className="font-semibold">{item.accommodation}</div>
                    <div className="text-gray-600">{item.description}</div>
                    <div className="text-xs text-gray-500">{item.whoBenefits}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">State-Specific Rights</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                {result.stateSpecific?.map((item, idx) => (
                  <li key={idx}>{item.right}: {item.description}</li>
                ))}
              </ul>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <h3 className="text-lg font-semibold text-amber-900">Red Flags to Watch</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-amber-900/80">
                {result.redFlags?.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Questions to Ask</h3>
              <ol className="mt-2 list-decimal pl-6 text-sm text-gray-600">
                {result.questionsToAsk?.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </Card>
            <p className="text-xs text-gray-400">{result.disclaimer}</p>
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
