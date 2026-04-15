import { createContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut
} from "firebase/auth";
import { auth, googleProvider } from "../firebase.js";
import { api } from "../utils/api.js";

export const AuthContext = createContext(null);

function normalizeEmail(email) {
  return email.trim();
}

function formatAuthError(error) {
  switch (error?.code) {
    case "auth/invalid-credential":
      return new Error("Incorrect email or password.");
    case "auth/user-not-found":
      return new Error("No account was found for that email.");
    case "auth/wrong-password":
      return new Error("Incorrect email or password.");
    case "auth/email-already-in-use":
      return new Error("That email is already registered.");
    case "auth/invalid-email":
      return new Error("Please enter a valid email address.");
    case "auth/weak-password":
      return new Error("Password should be at least 6 characters.");
    default:
      return new Error(error?.message || "Authentication failed.");
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);

      if (!firebaseUser) {
        setToken(null);
        setProfile(null);
        setProfileLoading(false);
        setLoading(false);
        return;
      }

      setLoading(false);
      setProfileLoading(true);

      firebaseUser.getIdToken()
        .then(async (freshToken) => {
          setToken(freshToken);
          const me = await api.post("/auth/me", {}, freshToken).catch(() => null);
          setProfile(me);
        })
        .catch(() => {
          setToken(null);
          setProfile(null);
        })
        .finally(() => {
          setProfileLoading(false);
        });
    });
    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      profile,
      loading,
      profileLoading,
      loginWithGoogle: () => signInWithPopup(auth, googleProvider),
      loginWithEmail: async (email, password) => {
        const trimmedEmail = normalizeEmail(email);
        try {
          return await signInWithEmailAndPassword(auth, trimmedEmail, password);
        } catch (error) {
          const lowercasedEmail = trimmedEmail.toLowerCase();
          if (
            error?.code === "auth/invalid-credential" &&
            lowercasedEmail !== trimmedEmail
          ) {
            try {
              return await signInWithEmailAndPassword(auth, lowercasedEmail, password);
            } catch (retryError) {
              throw formatAuthError(retryError);
            }
          }
          throw formatAuthError(error);
        }
      },
      registerWithEmail: async (name, email, password) => {
        try {
          const cred = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
          await updateProfile(cred.user, { displayName: name.trim() });
          return cred;
        } catch (error) {
          throw formatAuthError(error);
        }
      },
      logout: () => signOut(auth),
      getToken: async () => {
        const current = auth.currentUser;
        if (!current) return null;
        const freshToken = await current.getIdToken();
        setToken(freshToken);
        return freshToken;
      },
      setProfile
    }),
    [user, token, profile, loading, profileLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
