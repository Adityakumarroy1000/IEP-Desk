import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

const fallbackAuthContext = {
  user: null,
  token: null,
  profile: null,
  loading: true,
  profileLoading: true,
  loginWithGoogle: async () => null,
  loginWithEmail: async () => null,
  registerWithEmail: async () => null,
  logout: async () => null,
  getToken: async () => null,
  setProfile: () => null
};

export const useAuth = () => useContext(AuthContext) || fallbackAuthContext;
