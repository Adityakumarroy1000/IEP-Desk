import { useEffect, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import QuickActionCard from "../components/dashboard/QuickActionCard.jsx";
import ProfileCard from "../components/dashboard/ProfileCard.jsx";
import { useApi } from "../hooks/useApi.js";
import { useProfile } from "../hooks/useProfile.js";
import { useAuth } from "../hooks/useAuth.js";
import { FileText, ShieldCheck, MessageSquareText } from "lucide-react";

const asArray = (value) => (Array.isArray(value) ? value : []);
const DASHBOARD_CACHE_KEY = "iep_dashboard_cache_v1";
const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 1000;

export default function Dashboard() {
  const api = useApi();
  const { user } = useAuth();
  const { profiles, setProfiles, activeProfileId, setActiveProfileId } = useProfile();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meetingPreps, setMeetingPreps] = useState([]);
  const [error, setError] = useState("");
  const initialActiveProfileIdRef = useRef(activeProfileId);

  useEffect(() => {
    let hasFreshCache = false;
    try {
      const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        const isFresh = Date.now() - Number(cached?.updatedAt || 0) < DASHBOARD_CACHE_TTL_MS;
        if (isFresh) {
          const cachedProfiles = asArray(cached?.profiles);
          const cachedAnalyses = asArray(cached?.analyses);
          const cachedMeetingPreps = asArray(cached?.meetingPreps);
          const cachedActiveProfileId = cached?.activeProfileId || null;
          setProfiles(cachedProfiles);
          setAnalyses(cachedAnalyses);
          setMeetingPreps(cachedMeetingPreps);
          if (cachedActiveProfileId) setActiveProfileId(cachedActiveProfileId);
          hasFreshCache = true;
          setLoading(false);
        }
      }
    } catch {
      sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
    }

    const load = async () => {
      try {
        setError("");
        const profileData = await api.get("/profile");
        const normalizedProfiles = asArray(profileData?.profiles ?? profileData);
        setProfiles(normalizedProfiles);
        if (!initialActiveProfileIdRef.current && normalizedProfiles.length) {
          setActiveProfileId(normalizedProfiles[0]._id);
        }
        if (normalizedProfiles.length) {
          const list = await api.get(`/analyze/${normalizedProfiles[0]._id}`);
          const normalizedAnalyses = asArray(list?.analyses ?? list);
          setAnalyses(normalizedAnalyses);

          const meetingPrepsList = await api.get(`/meeting-prep/${normalizedProfiles[0]._id}`);
          const normalizedMeetingPreps = asArray(meetingPrepsList?.meetingPreps ?? meetingPrepsList);
          setMeetingPreps(normalizedMeetingPreps);
          sessionStorage.setItem(
            DASHBOARD_CACHE_KEY,
            JSON.stringify({
              profiles: normalizedProfiles,
              analyses: normalizedAnalyses,
              meetingPreps: normalizedMeetingPreps,
              activeProfileId: initialActiveProfileIdRef.current || normalizedProfiles[0]?._id || null,
              updatedAt: Date.now()
            })
          );
        } else {
          sessionStorage.setItem(
            DASHBOARD_CACHE_KEY,
            JSON.stringify({
              profiles: normalizedProfiles,
              analyses: [],
              meetingPreps: [],
              activeProfileId: null,
              updatedAt: Date.now()
            })
          );
        }
      } catch (err) {
        setError(err?.message || "Failed to load dashboard data.");
      } finally {
        if (!hasFreshCache) setLoading(false);
      }
    };
    load();
  }, []);

  const activeProfile = profiles.find((p) => p._id === activeProfileId) || profiles[0];
  const recent = asArray(analyses).slice(0, 3);

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title={`Welcome${user?.displayName ? `, ${user.displayName}` : ""}`} actions={null}>
        {loading ? (
          <Spinner label="Loading dashboard" />
        ) : (
          <div className="grid gap-6">
            {error && (
              <Card className="border-red-200 bg-red-50">
                <p className="text-sm text-red-700">{error}</p>
              </Card>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              <QuickActionCard
                title="Analyze IEP"
                description="Upload an IEP to get AI analysis."
                to="/analyzer"
                icon={<FileText className="h-5 w-5 text-primary" />}
                accent="bg-white/85"
              />
              <QuickActionCard
                title="View Rights"
                description="Understand federal and state protections."
                to="/rights"
                icon={<ShieldCheck className="h-5 w-5 text-primary" />}
                accent="bg-white/85"
              />
              <QuickActionCard
                title="Meeting Prep"
                description="Generate scripts and questions."
                to="/meeting-prep"
                icon={<MessageSquareText className="h-5 w-5 text-primary" />}
                accent="bg-white/85"
              />
            </div>
            {activeProfile ? (
              <div className="grid gap-3">
                {asArray(profiles).length > 1 ? (
                  <Card className="bg-white/80">
                    <label className="block text-sm text-gray-700">
                      <span className="mb-2 block text-sm text-gray-600">Active Child</span>
                      <select
                        className="w-full rounded-lg border border-gray-300 px-4 py-3"
                        value={activeProfileId || activeProfile._id}
                        onChange={(e) => setActiveProfileId(e.target.value)}
                      >
                        {asArray(profiles).map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.childName} ({p.grade} - {p.state})
                          </option>
                        ))}
                      </select>
                    </label>
                  </Card>
                ) : null}
                <ProfileCard profile={activeProfile} />
                <div>
                  <a className="text-sm font-semibold text-primary" href="/profile">Manage child profiles -&gt;</a>
                </div>
              </div>
            ) : (
              <Card className="border-primary/20 bg-white/85">
                <h3 className="text-lg font-semibold text-gray-800">Create your first child profile</h3>
                <p className="text-sm text-gray-500">Add your child's details to unlock analysis, rights, and meeting prep.</p>
                <div className="mt-3">
                  <a className="text-sm font-semibold text-primary" href="/profile">Start a profile -&gt;</a>
                </div>
              </Card>
            )}
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Recent Analyses</h3>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {recent.length ? recent.map((a) => (
                  <div key={a._id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-3 py-2">
                    <div>
                      <div className="font-semibold text-gray-800">{a.analysisKey || a.documentName || "IEP Analysis"}</div>
                      <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className="rounded-full bg-primary-light px-2 py-1 text-xs font-semibold text-primary">
                      Score {a?.result?.overallScore?.score ?? "-"}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No analyses yet.</p>
                )}
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Recent Meeting Preps</h3>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {asArray(meetingPreps).length ? asArray(meetingPreps).map((prep) => (
                  <div key={prep._id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-3 py-2">
                    <div>
                      <div className="font-semibold text-gray-800">{prep.meetingType || "Meeting Prep"}</div>
                      <div className="text-xs text-gray-500">{new Date(prep.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className="rounded-full bg-primary-light px-2 py-1 text-xs font-semibold text-primary">
                      {prep.meetingType || "Meeting Prep"}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No meeting preps yet.</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
