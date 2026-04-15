import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Badge from "../components/ui/Badge.jsx";
import { extractPdfText } from "../utils/pdfParser.js";
import { useApi } from "../hooks/useApi.js";
import { useProfile } from "../hooks/useProfile.js";

const FERPA_NOTICE = "FERPA notice: This page contains student educational records. Only upload documents you have permission to share.";

export default function Analyzer() {
  const api = useApi();
  const { profiles, setProfiles, activeProfileId, setActiveProfileId } = useProfile();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [latestAnalysisId, setLatestAnalysisId] = useState("");

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

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false
  });

  const analyze = async () => {
    if (!file || !activeProfileId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const extractedText = await extractPdfText(file);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", activeProfileId);
      formData.append("extractedText", extractedText);
      const payload = await api.post("/analyze", formData, { headers: {} });
      setResult(payload);
      const list = await api.get(`/analyze/${activeProfileId}`);
      if (list?.length) setLatestAnalysisId(list[0]._id);
    } catch (err) {
      setError(err.message || "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  const scoreTone = (score) => {
    if (score < 4) return "danger";
    if (score < 7) return "warning";
    return "success";
  };

  const goalTone = (quality) => {
    if (quality === "strong") return "success";
    if (quality === "weak") return "danger";
    return "warning";
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Analyze IEP">
        <div className="grid gap-6">
          <Card className="border-primary/20 bg-white/90">
            <div className="grid gap-4">
              <label className="block text-sm text-gray-700">
                <span className="mb-2 block text-sm text-gray-600">Step 1: Select Profile</span>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={activeProfileId || ""} onChange={(e) => setActiveProfileId(e.target.value)}>
                  <option value="">Select child profile</option>
                  {profiles.map((p) => (
                    <option key={p._id} value={p._id}>{p.childName} - {p.grade}</option>
                  ))}
                </select>
              </label>
              <div
                {...getRootProps()}
                className={`rounded-xl border-2 border-dashed px-6 py-10 text-center ${isDragActive ? "border-primary bg-primary-light" : "border-gray-200 bg-white"}`}
              >
                <input {...getInputProps()} />
                <p className="text-sm text-gray-500">Step 2: Drag & drop your IEP PDF, or click to browse.</p>
                {file && <p className="mt-2 text-xs text-gray-500">Selected: {file.name}</p>}
              </div>
              <Button onClick={analyze} disabled={!file || !activeProfileId || loading}>
                {loading ? <Spinner label="Analyzing your IEP - this takes about 30 seconds..." /> : "Analyze IEP"}
              </Button>
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</div>}
              <p className="text-xs text-gray-400">{FERPA_NOTICE}</p>
            </div>
          </Card>

          {result && (
            <div className="grid gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Overall Score</h3>
                  <Badge tone={scoreTone(result?.overallScore?.score || 0)}>{result?.overallScore?.score}</Badge>
                </div>
                <p className="mt-2 text-sm text-gray-600">{result?.overallScore?.explanation}</p>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-800">Summary</h3>
                <p className="mt-2 text-sm text-gray-600">{result?.summary}</p>
              </Card>
              {result?.currentLevel && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-800">Current Level</h3>
                  <p className="mt-2 text-sm text-gray-600">{result.currentLevel.summary}</p>
                  <ul className="mt-3 list-disc pl-5 text-sm text-gray-600">
                    {result.currentLevel.concerns?.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                </Card>
              )}
              <Card>
                <h3 className="text-lg font-semibold text-gray-800">Red Flags</h3>
                <div className="mt-3 grid gap-3">
                  {result?.redFlags?.map((rf, idx) => (
                    <div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <div className="font-semibold">{rf.issue}</div>
                      <div className="text-xs">{rf.whyItMatters}</div>
                      <div className="text-xs">{rf.whatToDo}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-800">Goals Analysis</h3>
                <div className="mt-3 grid gap-3">
                  {result?.goalsAnalysis?.map((goal, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 bg-white/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold text-gray-800">{goal.goal}</div>
                        <Badge tone={goalTone(goal.quality)}>{goal.quality}</Badge>
                      </div>
                      {goal.problem && <p className="mt-2 text-xs text-red-600">Issue: {goal.problem}</p>}
                      <p className="mt-2 text-xs text-gray-600">Plain English: {goal.plainEnglish}</p>
                      {goal.improvedVersion && (
                        <div className="mt-2 rounded-lg border border-primary/10 bg-primary-light px-3 py-2 text-xs text-primary">
                          Improved version: {goal.improvedVersion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-800">Services Analysis</h3>
                <div className="mt-3 grid gap-3">
                  {result?.servicesAnalysis?.map((service, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 bg-white/70 p-3 text-sm">
                      <div className="font-semibold text-gray-800">{service.service}</div>
                      <div className="text-xs text-gray-500">Frequency: {service.frequency}</div>
                      {service.concern && <div className="mt-2 text-xs text-red-600">Concern: {service.concern}</div>}
                      <div className="mt-2 text-xs text-gray-600">Plain English: {service.plainEnglish}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-800">Accommodations</h3>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-700">Provided</div>
                    <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                      {result?.accommodationsAnalysis?.provided?.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-warning">Missing</div>
                    <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                      {result?.accommodationsAnalysis?.missing?.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
                {result?.accommodationsAnalysis?.explanation && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                    {result.accommodationsAnalysis.explanation}
                  </div>
                )}
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-800">Action Items</h3>
                <ol className="mt-2 list-decimal pl-6 text-sm text-gray-600">
                  {result?.actionItems?.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => (window.location.href = latestAnalysisId ? `/meeting-prep?analysisId=${latestAnalysisId}` : "/meeting-prep")}>
                  Generate Meeting Prep Kit
                </Button>
                <p className="text-xs text-gray-400">{result.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
