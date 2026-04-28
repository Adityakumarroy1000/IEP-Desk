import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Badge from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import { MEETING_TYPES } from "../utils/constants.js";
import { useApi } from "../hooks/useApi.js";
import { useProfile } from "../hooks/useProfile.js";
import { useAuth } from "../hooks/useAuth.js";

const FERPA_NOTICE = "FERPA notice: This page contains student educational records. Only share information you have permission to use.";

export default function MeetingPrep() {
  const api = useApi();
  const { profiles, setProfiles, activeProfileId, setActiveProfileId } = useProfile();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryProfileId = queryParams.get("profileId") || "";
  const queryMeetingPrepId = queryParams.get("meetingPrepId") || "";
  const isViewAllMode = location.pathname === "/meeting-preps" || queryParams.get("view") === "all";
  const [analysisId, setAnalysisId] = useState("");
  const [meetingType, setMeetingType] = useState(MEETING_TYPES[0]);
  const [analyses, setAnalyses] = useState([]);
  const [analysesLoading, setAnalysesLoading] = useState(false);
  const [analysesError, setAnalysesError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState("beforeMeeting");
  const [checked, setChecked] = useState({});
  const [searchParams] = useSearchParams();
  const [savedMeetingPreps, setSavedMeetingPreps] = useState([]);
  const [selectedMeetingPrepId, setSelectedMeetingPrepId] = useState("");
  const [meetingPrepFilterProfileId, setMeetingPrepFilterProfileId] = useState("all");
  const [deletingMeetingPrepId, setDeletingMeetingPrepId] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteMeetingPrep, setPendingDeleteMeetingPrep] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!profiles.length && !authLoading && user) {
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
  }, [api, profiles.length, queryProfileId, setActiveProfileId, setProfiles, authLoading, user]);

  useEffect(() => {
    if (!activeProfileId && profiles.length) {
      const preferredProfileId = queryProfileId && profiles.some((item) => item._id === queryProfileId)
        ? queryProfileId
        : profiles[0]._id;
      setActiveProfileId(preferredProfileId);
    }
  }, [profiles, activeProfileId, queryProfileId, setActiveProfileId]);

  useEffect(() => {
    const loadAnalyses = async () => {
      setAnalysesError("");
      if (activeProfileId) {
        setAnalysesLoading(true);
        try {
          const data = await api.get(`/analyze/${activeProfileId}`);
          setAnalyses(data || []);
        } catch (err) {
          setAnalyses([]);
          setAnalysesError(err.message || "Failed to load analyses");
        } finally {
          setAnalysesLoading(false);
        }
        return;
      }
      setAnalyses([]);
      setAnalysesLoading(false);
    };
    loadAnalyses();
  }, [activeProfileId]);

  useEffect(() => {
    if (!isViewAllMode) return;
    if (queryProfileId && profiles.some((item) => item._id === queryProfileId)) {
      setMeetingPrepFilterProfileId(queryProfileId);
      return;
    }
    setMeetingPrepFilterProfileId("all");
  }, [isViewAllMode, profiles, queryProfileId]);

  useEffect(() => {
    const queryAnalysisId = searchParams.get("analysisId");
    if (!queryAnalysisId || !analyses.length) return;
    const exists = analyses.some((a) => a._id === queryAnalysisId);
    if (exists) setAnalysisId(queryAnalysisId);
  }, [searchParams, analyses]);

  const loadSavedMeetingPreps = useCallback(async (profileId) => {
    if (!profileId || !user || authLoading) {
      setSavedMeetingPreps([]);
      setSelectedMeetingPrepId("");
      return;
    }
    setLoadingSaved(true);
    try {
      const list = await api.get(`/meeting-prep/${profileId}`);
      const activeProfile = profiles.find((item) => item._id === profileId);
      const normalized = asArray(list).map((item) => ({
        ...item,
        profileId,
        profileName: activeProfile?.childName || "Child",
        result: parsePossibleJson(item.result)
      }));
      setSavedMeetingPreps(normalized);
      if (normalized.length) {
        setSelectedMeetingPrepId((current) => (
          queryMeetingPrepId && normalized.some((item) => item._id === queryMeetingPrepId)
            ? queryMeetingPrepId
            : (
          current && normalized.some((item) => item._id === current)
            ? current
            : (isViewAllMode ? "" : normalized[0]._id)
            )
        ));
      } else {
        setSelectedMeetingPrepId("");
      }
    } catch {
      setSavedMeetingPreps([]);
      setSelectedMeetingPrepId("");
    } finally {
      setLoadingSaved(false);
    }
  }, [api, isViewAllMode, profiles, queryMeetingPrepId, user, authLoading]);

  const loadAllMeetingPreps = useCallback(async (profileList) => {
    if (!profileList.length || !user || authLoading) {
      setSavedMeetingPreps([]);
      setSelectedMeetingPrepId("");
      return;
    }

    setLoadingSaved(true);
    try {
      const responses = await Promise.all(
        profileList.map(async (profileItem) => {
          const list = await api.get(`/meeting-prep/${profileItem._id}`);
          return { profileItem, list: asArray(list) };
        })
      );

      const merged = responses
        .flatMap(({ profileItem, list }) => (
          list.map((item) => ({
            ...item,
            profileId: profileItem._id,
            profileName: profileItem.childName || "Child",
            result: item.result
          }))
        ))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setSavedMeetingPreps(merged);
      if (merged.length) {
        setSelectedMeetingPrepId((current) => (
          queryMeetingPrepId && merged.some((item) => item._id === queryMeetingPrepId)
            ? queryMeetingPrepId
            : (current && merged.some((item) => item._id === current) ? current : "")
        ));
      } else {
        setSelectedMeetingPrepId("");
      }
    } catch {
      setSavedMeetingPreps([]);
      setSelectedMeetingPrepId("");
    } finally {
      setLoadingSaved(false);
    }
  }, [api, queryMeetingPrepId]);

  useEffect(() => {
    if (isViewAllMode) {
      loadAllMeetingPreps(profiles);
      return;
    }
    loadSavedMeetingPreps(activeProfileId);
  }, [activeProfileId, isViewAllMode, loadAllMeetingPreps, loadSavedMeetingPreps, profiles]);

  const visibleMeetingPreps = useMemo(() => {
    if (!isViewAllMode) return savedMeetingPreps;
    if (meetingPrepFilterProfileId === "all") return savedMeetingPreps;
    return savedMeetingPreps.filter((item) => item.profileId === meetingPrepFilterProfileId);
  }, [meetingPrepFilterProfileId, isViewAllMode, savedMeetingPreps]);

  useEffect(() => {
    if (!isViewAllMode || !selectedMeetingPrepId) return;
    if (!visibleMeetingPreps.some((item) => item._id === selectedMeetingPrepId)) {
      setSelectedMeetingPrepId("");
      setResult(null);
    }
  }, [isViewAllMode, selectedMeetingPrepId, visibleMeetingPreps]);

  useEffect(() => {
    if (!selectedMeetingPrepId) {
      if (isViewAllMode) {
        setResult(null);
      }
      return;
    }
    const selected = savedMeetingPreps.find((item) => item._id === selectedMeetingPrepId);
    if (selected?.result && typeof selected.result === "object") {
      setResult(selected.result);
    }
  }, [isViewAllMode, savedMeetingPreps, selectedMeetingPrepId]);

  useEffect(() => {
    if (!analysisId) return;
    const exists = analyses.some((a) => a._id === analysisId);
    if (!exists) setAnalysisId("");
  }, [analyses, analysisId]);

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
      if (!isViewAllMode) {
        await loadSavedMeetingPreps(activeProfileId);
      } else {
        await loadAllMeetingPreps(profiles);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteMeetingPrep = async (meetingPrepId) => {
    const target = savedMeetingPreps.find((item) => item._id === meetingPrepId) || null;
    setPendingDeleteMeetingPrep(target);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMeetingPrep = async () => {
    const meetingPrepId = pendingDeleteMeetingPrep?._id;
    if (!meetingPrepId) return;

    setDeletingMeetingPrepId(meetingPrepId);
    try {
      await api.del(`/meeting-prep/${meetingPrepId}`);
      if (selectedMeetingPrepId === meetingPrepId) {
        setSelectedMeetingPrepId("");
        setResult(null);
      }
      if (isViewAllMode) {
        await loadAllMeetingPreps(profiles);
      } else {
        await loadSavedMeetingPreps(activeProfileId);
      }
    } catch (err) {
      console.error("Failed to delete meeting prep:", err);
    } finally {
      setDeleteConfirmOpen(false);
      setPendingDeleteMeetingPrep(null);
      setDeletingMeetingPrepId("");
    }
  };

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

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
      <PageWrapper title={isViewAllMode ? "Saved Meeting Preps" : "Meeting Prep"}>
        <Card className="border-primary/20 bg-white/90">
          <div className="grid gap-4">
            {!isViewAllMode && (
              <label className="block text-sm text-gray-700">
                <span className="mb-2 block text-sm text-gray-600">Select Profile</span>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={activeProfileId || ""} onChange={(e) => setActiveProfileId(e.target.value)}>
                  <option value="">Select child profile</option>
                  {profiles.map((p) => (
                    <option key={p._id} value={p._id}>{p.childName}</option>
                  ))}
                </select>
              </label>
            )}
            {!isViewAllMode && (
              <>
                <label className="block text-sm text-gray-700">
                  <span className="mb-2 block text-sm text-gray-600">Select Analysis</span>
                  <select className="w-full rounded-lg border border-gray-300 px-4 py-3" value={analysisId} onChange={(e) => setAnalysisId(e.target.value)}>
                    <option value="">Select analysis</option>
                    {analyses.map((a) => (
                      <option key={a._id} value={a._id}>{a.analysisKey || a.documentName || "Analysis"} - {new Date(a.createdAt).toLocaleDateString()}</option>
                    ))}
                  </select>
                  {analysesLoading && <p className="mt-2 text-xs text-gray-500">Loading analyses...</p>}
                  {!analysesLoading && analysesError && <p className="mt-2 text-xs text-red-600">{analysesError}</p>}
                  {!analysesLoading && !analysesError && activeProfileId && !analyses.length && (
                    <p className="mt-2 text-xs text-gray-500">No analyses found for this child yet. Upload and analyze an IEP first.</p>
                  )}
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
                <label className="block text-sm text-gray-700">
                  <span className="mb-2 block text-sm text-gray-600">Open Saved Meeting Prep</span>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    value={selectedMeetingPrepId}
                    onChange={(e) => setSelectedMeetingPrepId(e.target.value)}
                    disabled={!savedMeetingPreps.length || loadingSaved}
                  >
                    <option value="">{loadingSaved ? "Loading meeting preps..." : "Select saved meeting prep"}</option>
                    {savedMeetingPreps.map((entry) => {
                      const createdAt = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Unknown date";
                      const meetingLabel = `${entry.meetingType} Meeting Prep`;
                      return (
                        <option key={entry._id} value={entry._id}>
                          {`${meetingLabel} | ${createdAt} | ${entry.profileName}`}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </>
            )}

            {isViewAllMode && (
              <div className="grid gap-3">
                <h3 className="text-sm font-semibold text-gray-700">All Saved Meeting Preps</h3>
                <label className="block text-sm text-gray-700">
                  <span className="mb-2 block text-sm text-gray-600">Filter by Child</span>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    value={meetingPrepFilterProfileId}
                    onChange={(e) => setMeetingPrepFilterProfileId(e.target.value)}
                  >
                    <option value="all">All Meeting Preps</option>
                    {profiles.map((profileItem) => (
                      <option key={profileItem._id} value={profileItem._id}>
                        {profileItem.childName}
                      </option>
                    ))}
                  </select>
                </label>
                {loadingSaved ? (
                  <Spinner label="Loading meeting preps..." />
                ) : visibleMeetingPreps.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {visibleMeetingPreps.map((entry) => {
                      const createdAt = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Unknown date";
                      const meetingLabel = `${entry.meetingType} Meeting Prep`;
                      const isActive = selectedMeetingPrepId === entry._id;
                      return (
                        <div
                          key={entry._id}
                          className={`rounded-xl border px-4 py-3 transition ${isActive ? "border-primary bg-primary-light" : "border-gray-200 bg-white hover:border-primary/40"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedMeetingPrepId(entry._id)}
                              className="flex-1 text-left"
                            >
                              <div className="text-sm font-semibold text-gray-800">{meetingLabel}</div>
                              <div className="mt-1 text-xs text-gray-500">{entry.profileName} | {createdAt}</div>
                              <div className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-xs font-semibold text-primary">{entry.meetingType}</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMeetingPrep(entry._id)}
                              disabled={deletingMeetingPrepId === entry._id}
                              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingMeetingPrepId === entry._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No saved meeting preps for this filter yet.</p>
                )}
              </div>
            )}
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
      <Modal
        open={deleteConfirmOpen}
        title="Delete Meeting Prep Permanently"
        onClose={() => {
          if (deletingMeetingPrepId) return;
          setDeleteConfirmOpen(false);
          setPendingDeleteMeetingPrep(null);
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This action cannot be undone. This meeting prep will be removed permanently.
          </p>
          {pendingDeleteMeetingPrep && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {pendingDeleteMeetingPrep.meetingType} Meeting Prep - {pendingDeleteMeetingPrep.profileName}
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setPendingDeleteMeetingPrep(null);
              }}
              disabled={Boolean(deletingMeetingPrepId)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteMeetingPrep}
              disabled={Boolean(deletingMeetingPrepId)}
            >
              {deletingMeetingPrepId ? "Deleting..." : "Delete Permanently"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
