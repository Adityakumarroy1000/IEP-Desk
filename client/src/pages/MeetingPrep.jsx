import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { MEETING_TYPES } from "../utils/constants.js";
import { useApi } from "../hooks/useApi.js";
import { useProfile } from "../hooks/useProfile.js";

const FERPA_NOTICE = "FERPA notice: This page contains student educational records. Only share information you have permission to use.";

export default function MeetingPrep() {
  const api = useApi();
  const { profiles, setProfiles, activeProfileId, setActiveProfileId } = useProfile();
  const [analysisId, setAnalysisId] = useState("");
  const [meetingType, setMeetingType] = useState(MEETING_TYPES[0]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState("beforeMeeting");
  const [checked, setChecked] = useState({});
  const [searchParams] = useSearchParams();

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

  useEffect(() => {
    const loadAnalyses = async () => {
      if (activeProfileId) {
        const data = await api.get(`/analyze/${activeProfileId}`);
        setAnalyses(data || []);
      }
    };
    loadAnalyses();
  }, [activeProfileId]);

  useEffect(() => {
    const queryId = searchParams.get("analysisId");
    if (queryId) setAnalysisId(queryId);
  }, [searchParams]);

  useEffect(() => {
    if (!result?.checklist) return;
    const next = {};
    ["bringToMeeting", "beforeMeeting", "afterMeeting"].forEach((section) => {
      next[section] = {};
      result.checklist[section]?.forEach((item) => {
        next[section][item] = false;
      });
    });
    setChecked(next);
  }, [result]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const payload = await api.post("/meeting-prep", { profileId: activeProfileId, analysisId, meetingType });
      setResult(payload);
    } finally {
      setLoading(false);
    }
  };

  const templates = useMemo(() => {
    return result?.emailTemplates || {};
  }, [result]);

  const copyTemplate = async () => {
    const tpl = templates[activeTemplate];
    if (!tpl) return;
    const text = `${tpl.subject}\n\n${tpl.body}`;
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  };

  const toggleCheck = (section, item) => {
    setChecked((prev) => ({
      ...prev,
      [section]: { ...prev[section], [item]: !prev[section]?.[item] }
    }));
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Meeting Prep">
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
            <label className="block text-sm text-gray-700">
              <span className="mb-2 block text-sm text-gray-600">Select Analysis</span>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={analysisId} onChange={(e) => setAnalysisId(e.target.value)}>
                <option value="">Select analysis</option>
                {analyses.map((a) => (
                  <option key={a._id} value={a._id}>{a.documentName || "Analysis"} - {new Date(a.createdAt).toLocaleDateString()}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-gray-700">
              <span className="mb-2 block text-sm text-gray-600">Meeting Type</span>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={meetingType} onChange={(e) => setMeetingType(e.target.value)}>
                {MEETING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <Button onClick={handleGenerate} disabled={!activeProfileId || !analysisId || loading}>
              {loading ? <Spinner label="Generating prep kit" /> : "Generate Meeting Prep Kit"}
            </Button>
            <p className="text-xs text-gray-400">{FERPA_NOTICE}</p>
          </div>
        </Card>

        {result && (
          <div className="mt-6 grid gap-4">
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => window.print()}>Print Prep Kit</Button>
            </div>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Meeting Overview</h3>
              <p className="mt-2 text-sm text-gray-600">{result.meetingOverview}</p>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Key Questions</h3>
              <div className="mt-3 space-y-3">
                {result.keyQuestions?.map((q, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 bg-white/70 p-3">
                    <div className="font-semibold text-gray-700">{q.question}</div>
                    <div className="text-xs text-gray-500">Why: {q.whyImportant}</div>
                    <div className="text-xs text-green-700">Good answer: {q.goodAnswer}</div>
                    <div className="text-xs text-red-700">Red flag: {q.redFlagAnswer}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Pushback Scripts</h3>
              <div className="mt-3 space-y-3">
                {result.pushbackScripts?.map((p, idx) => (
                  <details key={idx} className="rounded-lg border border-gray-200 bg-white/70 p-3">
                    <summary className="cursor-pointer font-semibold">{p.situation}</summary>
                    <div className="mt-2 text-sm text-gray-600">{p.whatToSay}</div>
                    <div className="text-xs text-gray-500">Legal basis: {p.legalBasis}</div>
                  </details>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Rights Reminder</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                {result.rightsReminder?.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </Card>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-800">Email Templates</h3>
                <Button variant="ghost" onClick={copyTemplate}>Copy Template</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.keys(templates).map((key) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setActiveTemplate(key)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${activeTemplate === key ? "border-primary bg-primary-light text-primary" : "border-gray-200 text-gray-500"}`}
                  >
                    {key.replace(/([A-Z])/g, " $1")}
                  </button>
                ))}
              </div>
              {templates[activeTemplate] && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white/70 p-4 text-sm">
                  <div className="font-semibold text-gray-800">{templates[activeTemplate].subject}</div>
                  <p className="mt-2 text-gray-600 whitespace-pre-line">{templates[activeTemplate].body}</p>
                </div>
              )}
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800">Checklist</h3>
              {result.checklist && (
                <div className="mt-2 grid gap-3 md:grid-cols-3 text-sm text-gray-600">
                  <div>
                    <div className="font-semibold">Bring to Meeting</div>
                    <ul className="mt-2 space-y-2">
                      {result.checklist.bringToMeeting?.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <input type="checkbox" checked={checked.bringToMeeting?.[item] || false} onChange={() => toggleCheck("bringToMeeting", item)} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold">Before Meeting</div>
                    <ul className="mt-2 space-y-2">
                      {result.checklist.beforeMeeting?.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <input type="checkbox" checked={checked.beforeMeeting?.[item] || false} onChange={() => toggleCheck("beforeMeeting", item)} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold">After Meeting</div>
                    <ul className="mt-2 space-y-2">
                      {result.checklist.afterMeeting?.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <input type="checkbox" checked={checked.afterMeeting?.[item] || false} onChange={() => toggleCheck("afterMeeting", item)} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
            <p className="text-xs text-gray-400">{result.disclaimer}</p>
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
