import { useEffect, useState } from "react";
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

export default function Dashboard() {
  const api = useApi();
  const { user } = useAuth();
  const { profiles, setProfiles, activeProfileId, setActiveProfileId } = useProfile();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const profileData = await api.get("/profile");
        setProfiles(profileData || []);
        if (!activeProfileId && profileData?.length) {
          setActiveProfileId(profileData[0]._id);
        }
        if (profileData?.length) {
          const list = await api.get(`/analyze/${profileData[0]._id}`);
          setAnalyses(list || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeProfile = profiles.find((p) => p._id === activeProfileId) || profiles[0];

  const recent = analyses?.slice(0, 3) || [];

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title={`Welcome${user?.displayName ? `, ${user.displayName}` : ""}`}
        actions={null}
      >
        {loading ? (
          <Spinner label="Loading dashboard" />
        ) : (
          <div className="grid gap-6">
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
              <ProfileCard profile={activeProfile} />
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
                <a className="text-xs font-semibold text-primary" href="/analyzer">View all</a>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {recent.length ? recent.map((a) => (
                  <div key={a._id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/70 px-3 py-2">
                    <div>
                      <div className="font-semibold text-gray-800">{a.documentName || "IEP Analysis"}</div>
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
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
