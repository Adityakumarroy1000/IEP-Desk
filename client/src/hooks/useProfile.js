import { useContext } from "react";
import { ProfileContext } from "../context/ProfileContext.jsx";

export const useProfile = () => useContext(ProfileContext);
