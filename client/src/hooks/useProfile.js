import { useContext } from "react";
import { ProfileContext } from "../context/ProfileContext.jsx";

const fallbackProfileContext = {
  profiles: [],
  setProfiles: () => null,
  activeProfileId: null,
  setActiveProfileId: () => null
};

export const useProfile = () => useContext(ProfileContext) || fallbackProfileContext;
