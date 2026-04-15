import { createContext, useMemo, useState } from "react";

export const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const setProfilesSafe = (next) => {
    if (Array.isArray(next)) {
      setProfiles(next);
    } else {
      setProfiles([]);
    }
  };

  const value = useMemo(
    () => ({
      profiles,
      setProfiles: setProfilesSafe,
      activeProfileId,
      setActiveProfileId
    }),
    [profiles, activeProfileId]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
