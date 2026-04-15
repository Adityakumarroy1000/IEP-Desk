import { useEffect, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useApi } from "../hooks/useApi.js";
import { EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, updateEmail, updatePassword, updateProfile } from "firebase/auth";
import { googleProvider } from "../firebase.js";

export default function Settings() {
  const { user, profile, setProfile, logout } = useAuth();
  const api = useApi();
  const fileInputRef = useRef(null);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [photo, setPhoto] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar || user?.photoURL || "");
  const [loading, setLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] = useState("success");
  const [credentialsMessage, setCredentialsMessage] = useState("");
  const [credentialsMessageType, setCredentialsMessageType] = useState("success");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteMessageType, setDeleteMessageType] = useState("success");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setAvatarUrl(profile?.avatar || user?.photoURL || "");
  }, [profile, user]);

  const saveProfile = async () => {
    setLoading(true);
    setProfileMessage("");
    try {
      if (displayName && user) {
        await updateProfile(user, { displayName });
      }
      if (photo) {
        const formData = new FormData();
        formData.append("file", photo);
        const res = await api.post("/auth/avatar", formData);
        if (res?.avatar) {
          setAvatarUrl(res.avatar);
          setProfile?.((prev) => ({ ...(prev || {}), avatar: res.avatar }));
          if (user) await updateProfile(user, { photoURL: res.avatar });
        }
      }
      setProfileMessageType("success");
      setProfileMessage("Settings updated.");
    } catch (err) {
      setProfileMessageType("error");
      setProfileMessage(err?.message || "Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  const requireReauth = async () => {
    if (!user) throw new Error("Not signed in");
    const isGoogle = user.providerData?.some((p) => p.providerId === "google.com");
    const isPassword = user.providerData?.some((p) => p.providerId === "password");
    if (isGoogle) {
      await reauthenticateWithPopup(user, googleProvider);
      return;
    }
    if (isPassword) {
      if (!currentPassword) {
        throw new Error("Please enter your current password to continue.");
      }
      const credential = EmailAuthProvider.credential(user.email || "", currentPassword);
      await reauthenticateWithCredential(user, credential);
      return;
    }
    throw new Error("Please re-authenticate to continue.");
  };

  const changeEmailPassword = async () => {
    setLoading(true);
    setCredentialsMessage("");
    try {
      if (!newEmail && !newPassword) {
        throw new Error("Enter a new email or a new password.");
      }
      if (newPassword && newPassword !== confirmPassword) {
        throw new Error("New password and confirmation do not match.");
      }
      await requireReauth();
      if (newEmail) await updateEmail(user, newEmail.trim());
      if (newPassword) await updatePassword(user, newPassword);
      setCredentialsMessageType("success");
      setCredentialsMessage("Credentials updated.");
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
    } catch (err) {
      setCredentialsMessageType("error");
      setCredentialsMessage(err?.message || "Failed to update credentials.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    setDeleteMessage("");
    try {
      await requireReauth();
      await api.del("/auth/delete");
      if (user) {
        await user.delete();
      }
      await logout();
      setDeleteMessageType("success");
      setDeleteMessage("Account deleted.");
    } catch (err) {
      setDeleteMessageType("error");
      setDeleteMessage(err?.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Settings">
        <div className="grid gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
            {profileMessage && (
              <div className={`mt-4 rounded-lg border p-3 text-xs ${profileMessageType === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"}`}>
                {profileMessage}
              </div>
            )}
            <div className="mt-4 grid gap-3">
              <div className="w-fit">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-20 w-20 overflow-hidden rounded-full border border-gray-200"
                  aria-label="Change profile photo"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-500">
                      No Photo
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-2h8l2 2h3a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    Change Profile
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                />
              </div>
              <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <Button onClick={saveProfile} disabled={loading}>{loading ? <Spinner label="Saving" /> : "Save"}</Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-800">Email & Password</h3>
            {credentialsMessage && (
              <div className={`mt-4 rounded-lg border p-3 text-xs ${credentialsMessageType === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"}`}>
                {credentialsMessage}
              </div>
            )}
            <div className="mt-4 grid gap-3">
              <Input label="New email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <Button onClick={changeEmailPassword} disabled={loading}>{loading ? <Spinner label="Updating" /> : "Update"}</Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-800">Delete Account</h3>
            {deleteMessage && (
              <div className={`mt-4 rounded-lg border p-3 text-xs ${deleteMessageType === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"}`}>
                {deleteMessage}
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              This permanently deletes your account. No backups will be kept.
            </p>
            <div className="mt-4 grid gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <div className="font-semibold">What will be erased:</div>
              <div>• Your profile (name, email, avatar)</div>
              <div>• All uploaded documents and files</div>
              <div>• All analyses, meeting prep data, and notes</div>
              <div>• All account settings and preferences</div>
            </div>
            {!showDeleteConfirm ? (
              <Button
                className="mt-4"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                {loading ? <Spinner label="Deleting" /> : "Delete Account"}
              </Button>
            ) : (
              <div className="mt-4 grid gap-3">
                <Input
                  label="Type DELETE to confirm"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                />
                <label className="flex items-start gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.checked)}
                  />
                  I understand this action is permanent and cannot be undone.
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="danger"
                    onClick={deleteAccount}
                    disabled={loading || !confirmDelete || deleteText.trim().toUpperCase() !== "DELETE"}
                  >
                    {loading ? <Spinner label="Deleting" /> : "Confirm Delete"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmDelete(false);
                      setDeleteText("");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </PageWrapper>
    </div>
  );
}
