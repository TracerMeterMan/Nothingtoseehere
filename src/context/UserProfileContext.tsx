import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultUserProfile, UserProfile, USER_PROFILE_KEY } from "../models/userProfile";

interface UserProfileContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  saveProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (changes: Partial<UserProfile>) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(USER_PROFILE_KEY)
      .then((stored) => setProfile(stored ? { ...defaultUserProfile, ...JSON.parse(stored) } : null))
      .catch((error) => console.error("Failed to load user profile", error))
      .finally(() => setIsLoading(false));
  }, []);

  const saveProfile = async (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextProfile));
  };

  const updateProfile = async (changes: Partial<UserProfile>) => {
    if (!profile) return;
    await saveProfile({ ...profile, ...changes });
  };

  return (
    <UserProfileContext.Provider value={{ profile, isLoading, saveProfile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) throw new Error("useUserProfile must be used within UserProfileProvider");
  return context;
}
