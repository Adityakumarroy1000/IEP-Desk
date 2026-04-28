import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Badge from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import { extractPdfText } from "../utils/pdfParser.js";
import { useApi } from "../hooks/useApi.js";
import { useProfile } from "../hooks/useProfile.js";

const FERPA_NOTICE = "FERPA notice: This page contains student educational records. Only upload documents you have permission to share.";

function parsePossibleJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeAnalysisResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = { ...value };
  result.redFlags = asArray(value.redFlags);
  result.goalsAnalysis = asArray(value.goalsAnalysis);
  result.servicesAnalysis = asArray(value.servicesAnalysis);
  result.actionItems = asArray(value.actionItems);
  result.currentLevel = {
    ...(value.currentLevel && typeof value.currentLevel === "object" ? value.currentLevel : {}),
    concerns: asArray(value.currentLevel?.concerns)
  };
  result.accommodationsAnalysis = {
    ...(value.accommodationsAnalysis && typeof value.accommodationsAnalysis === "object" ? value.accommodationsAnalysis : {}),
    provided: asArray(value.accommodationsAnalysis?.provided),
    missing: asArray(value.accommodationsAnalysis?.missing)
  };
  return result;
}

export default function Analyzer() {
  const api = useApi();
  const { profiles, setProfiles, activeProfileId, setActiveProfileId } = useProfile();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryProfileId = queryParams.get("profileId") || "";
  const queryAnalysisId = queryParams.get("analysisId") || "";
  const isViewAllMode = location.pathname === "/analyses" || queryParams.get("view") === "all";
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [latestAnalysisId, setLatestAnalysisId] = useState("");
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState("");
  const [analysisFilterProfileId, setAnalysisFilterProfileId] = useState("all");
  const [deletingAnalysisId, setDeletingAnalysisId] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteAnalysis, setPendingDeleteAnalysis] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!profiles.length) {
        const data = await api.get("/profile");
        setProfiles(data || []);
        if (data?.length) {
          const preferredProfileId = queryProfileId && data.some((item) => item._id === queryProfileId)
            ? queryProfileId
            : data[0]._id;
          setActiveProfileId(preferredProfileId);
        }
      }
    };
    load();
  }, [api, profiles.length, queryProfileId, setActiveProfileId, setProfiles]);

  useEffect(() => {
    if (!activeProfileId && profiles.length) {
      const preferredProfileId = queryProfileId && profiles.some((item) => item._id === queryProfileId)
        ? queryProfileId
        : profiles[0]._id;
      setActiveProfileId(preferredProfileId);
    }
  }, [profiles, activeProfileId, queryProfileId, setActiveProfileId]);

  useEffect(() => {
    if (!isViewAllMode) return;
    if (queryProfileId && profiles.some((item) => item._id === queryProfileId)) {
      setAnalysisFilterProfileId(queryProfileId);
      return;
    }
    setAnalysisFilterProfileId("all");
  }, [isViewAllMode, profiles, queryProfileId]);

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

  const loadSavedAnalyses = useCallback(async (profileId) => {
    if (!profileId) {
      setSavedAnalyses([]);
      setSelectedAnalysisId("");
      setLatestAnalysisId("");
      return;
    }
    setLoadingSaved(true);
    try {
      const list = await api.get(`/analyze/${profileId}`);
      const activeProfile = profiles.find((item) => item._id === profileId);
      const normalized = asArray(list).map((item) => ({
        ...item,
        profileId,
        profileName: activeProfile?.childName || "Child",
        result: normalizeAnalysisResult(parsePossibleJson(item.result))
      }));
      setSavedAnalyses(normalized);
      if (normalized.length) {
        setLatestAnalysisId(normalized[0]._id);
        setSelectedAnalysisId((current) => (
          queryAnalysisId && normalized.some((item) => item._id === queryAnalysisId)
            ? queryAnalysisId
            : (
          current && normalized.some((item) => item._id === current)
            ? current
            : (isViewAllMode ? "" : normalized[0]._id)
            )
        ));
      } else {
        setLatestAnalysisId("");
        setSelectedAnalysisId("");
      }
    } catch {
      setSavedAnalyses([]);
      setLatestAnalysisId("");
      setSelectedAnalysisId("");
    } finally {
      setLoadingSaved(false);
    }
  }, [api, isViewAllMode, profiles, queryAnalysisId]);

  const loadAllAnalyses = useCallback(async (profileList) => {
    if (!profileList.length) {
      setSavedAnalyses([]);
      setSelectedAnalysisId("");
      setLatestAnalysisId("");
      return;
    }

    setLoadingSaved(true);
    try {
      const responses = await Promise.all(
        profileList.map(async (profileItem) => {
          const list = await api.get(`/analyze/${profileItem._id}`);
          return { profileItem, list: asArray(list) };
        })
      );

      const merged = responses
        .flatMap(({ profileItem, list }) => (
          list.map((item) => ({
            ...item,
            profileId: profileItem._id,
            profileName: profileItem.childName || "Child",
            result: normalizeAnalysisResult(parsePossibleJson(item.result))
          }))
        ))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setSavedAnalyses(merged);
      if (merged.length) {
        setLatestAnalysisId(merged[0]._id);
        setSelectedAnalysisId((current) => (
          queryAnalysisId && merged.some((item) => item._id === queryAnalysisId)
            ? queryAnalysisId
            : (current && merged.some((item) => item._id === current) ? current : "")
        ));
      } else {
        setLatestAnalysisId("");
        setSelectedAnalysisId("");
      }
    } catch {
      setSavedAnalyses([]);
      setLatestAnalysisId("");
      setSelectedAnalysisId("");
    } finally {
      setLoadingSaved(false);
    }
  }, [api, queryAnalysisId]);

  useEffect(() => {
    if (isViewAllMode) {
      loadAllAnalyses(profiles);
      return;
    }
    loadSavedAnalyses(activeProfileId);
  }, [activeProfileId, isViewAllMode, loadAllAnalyses, loadSavedAnalyses, profiles]);

  const visibleAnalyses = useMemo(() => {
    if (!isViewAllMode) return savedAnalyses;
    if (analysisFilterProfileId === "all") return savedAnalyses;
    return savedAnalyses.filter((item) => item.profileId === analysisFilterProfileId);
  }, [analysisFilterProfileId, isViewAllMode, savedAnalyses]);

  useEffect(() => {
    if (!isViewAllMode || !selectedAnalysisId) return;
    if (!visibleAnalyses.some((item) => item._id === selectedAnalysisId)) {
      setSelectedAnalysisId("");
      setResult(null);
    }
  }, [isViewAllMode, selectedAnalysisId, visibleAnalyses]);

  useEffect(() => {
    if (!selectedAnalysisId) {
      if (isViewAllMode) {
        setResult(null);
      }
      return;
    }
    const selected = savedAnalyses.find((item) => item._id === selectedAnalysisId);
    if (selected?.result && typeof selected.result === "object") {
      setResult(normalizeAnalysisResult(selected.result));
      setLatestAnalysisId(selected._id);
    }
  }, [isViewAllMode, savedAnalyses, selectedAnalysisId]);

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
      const payload = await api.post("/analyze", formData);
      setResult(normalizeAnalysisResult(parsePossibleJson(payload)));
      await loadSavedAnalyses(activeProfileId);
    } catch (err) {
      setError(err.message || "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (analysisId) => {
    const target = savedAnalyses.find((item) => item._id === analysisId) || null;
    setPendingDeleteAnalysis(target);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAnalysis = async () => {
    const analysisId = pendingDeleteAnalysis?._id;
    if (!analysisId) return;

    setDeletingAnalysisId(analysisId);
    setError("");
    try {
      await api.del(`/analyze/${analysisId}`);
      if (selectedAnalysisId === analysisId) {
        setSelectedAnalysisId("");
        setResult(null);
      }
      if (isViewAllMode) {
        await loadAllAnalyses(profiles);
      } else {
        await loadSavedAnalyses(activeProfileId);
      }
    } catch (err) {
      setError(err.message || "Failed to delete analysis");
    } finally {
      setDeleteConfirmOpen(false);
      setPendingDeleteAnalysis(null);
      setDeletingAnalysisId("");
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
      <PageWrapper title={isViewAllMode ? "Saved Analyses" : "Analyze IEP"}>
        <div className="grid gap-6">
          <Card className="border-primary/20 bg-white/90">
            <div className="grid gap-4">
              {!isViewAllMode && (
                <label className="block text-sm text-gray-700">
                  <span className="mb-2 block text-sm text-gray-600">Step 1: Select Profile</span>
                  <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={activeProfileId || ""} onChange={(e) => setActiveProfileId(e.target.value)}>
                    <option value="">Select child profile</option>
                    {profiles.map((p) => (
                      <option key={p._id} value={p._id}>{p.childName} - {p.grade}</option>
                    ))}
                  </select>
                </label>
              )}
              {!isViewAllMode && (
                <>
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
                  <label className="block text-sm text-gray-700">
                    <span className="mb-2 block text-sm text-gray-600">Open Saved Analysis</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                      value={selectedAnalysisId}
                      onChange={(e) => setSelectedAnalysisId(e.target.value)}
                      disabled={!savedAnalyses.length || loadingSaved}
                    >
                      <option value="">{loadingSaved ? "Loading analyses..." : "Select saved analysis"}</option>
                      {savedAnalyses.map((entry) => {
                        const createdAt = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Unknown date";
                        const score = entry.result?.overallScore?.score ?? "-";
                        const analysisLabel = entry.analysisKey || entry.documentName || "IEP Analysis";
                        return (
                          <option key={entry._id} value={entry._id}>
                            {`${analysisLabel} | ${createdAt} | Score ${score}`}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </>
              )}

              {isViewAllMode && (
                <div className="grid gap-3">
                  <h3 className="text-sm font-semibold text-gray-700">All Saved Analyses</h3>
                  <label className="block text-sm text-gray-700">
                    <span className="mb-2 block text-sm text-gray-600">Filter by Child</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                      value={analysisFilterProfileId}
                      onChange={(e) => setAnalysisFilterProfileId(e.target.value)}
                    >
                      <option value="all">All Analyses</option>
                      {profiles.map((profileItem) => (
                        <option key={profileItem._id} value={profileItem._id}>
                          {profileItem.childName}
                        </option>
                      ))}
                    </select>
                  </label>
                  {loadingSaved ? (
                    <Spinner label="Loading analyses..." />
                  ) : visibleAnalyses.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {visibleAnalyses.map((entry) => {
                        const createdAt = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Unknown date";
                        const score = entry.result?.overallScore?.score ?? "-";
                        const analysisLabel = entry.analysisKey || entry.documentName || "IEP Analysis";
                        const isActive = selectedAnalysisId === entry._id;
                        return (
                          <div
                            key={entry._id}
                            className={`rounded-xl border px-4 py-3 transition ${isActive ? "border-primary bg-primary-light" : "border-gray-200 bg-white hover:border-primary/40"}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedAnalysisId(entry._id)}
                                className="flex-1 text-left"
                              >
                                <div className="text-sm font-semibold text-gray-800">{analysisLabel}</div>
                                <div className="mt-1 text-xs text-gray-500">{entry.profileName} | {createdAt}</div>
                                <div className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-xs font-semibold text-primary">Score {score}</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteAnalysis(entry._id)}
                                disabled={deletingAnalysisId === entry._id}
                                className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingAnalysisId === entry._id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No saved analyses for this filter yet.</p>
                  )}
                </div>
              )}
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</div>}
              {!isViewAllMode && <p className="text-xs text-gray-400">{FERPA_NOTICE}</p>}
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
                <Button variant="ghost" onClick={() => (window.location.href = latestAnalysisId ? `/meeting-prep?profileId=${activeProfileId}&analysisId=${latestAnalysisId}` : "/meeting-prep")}>
                  Generate Meeting Prep Kit
                </Button>
                <p className="text-xs text-gray-400">{result.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
      <Modal
        open={deleteConfirmOpen}
        title="Delete Analysis Permanently"
        onClose={() => {
          if (deletingAnalysisId) return;
          setDeleteConfirmOpen(false);
          setPendingDeleteAnalysis(null);
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This action cannot be undone. This analysis will be removed permanently.
          </p>
          {pendingDeleteAnalysis && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {pendingDeleteAnalysis.analysisKey || pendingDeleteAnalysis.documentName || "IEP Analysis"}
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setPendingDeleteAnalysis(null);
              }}
              disabled={Boolean(deletingAnalysisId)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteAnalysis}
              disabled={Boolean(deletingAnalysisId)}
            >
              {deletingAnalysisId ? "Deleting..." : "Delete Permanently"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
