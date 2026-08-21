import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Routine } from "../models/routine";

interface RoutineContextType {
  customRoutines: Routine[];
  deletedStarterIds: string[];
  addRoutine: (routine: Routine) => Promise<void>;
  updateRoutine: (routine: Routine) => Promise<void>; // ✅ Added this
  deleteRoutine: (id: string) => Promise<void>;
  isLoading: boolean;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

const STORAGE_KEY_CUSTOM = "@custom_routines";
const STORAGE_KEY_DELETED = "@deleted_starter_ids";

export const RoutineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customRoutines, setCustomRoutines] = useState<Routine[]>([]);
  const [deletedStarterIds, setDeletedStarterIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedCustom = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM);
        const storedDeleted = await AsyncStorage.getItem(STORAGE_KEY_DELETED);
        if (storedCustom) setCustomRoutines(JSON.parse(storedCustom));
        if (storedDeleted) setDeletedStarterIds(JSON.parse(storedDeleted));
      } catch (e) {
        console.error("Failed to load routines", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

 const addRoutine = async (routine: Routine) => {
  setCustomRoutines((prev) => {
    const exists = prev.some((r) => r.id === routine.id);
    const nextRoutines = exists
      ? prev.map((r) => (r.id === routine.id ? routine : r))
      : [...prev, routine];

    AsyncStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(nextRoutines)).catch((e) =>
      console.error("Failed to sync async storage on add", e)
    );
    return nextRoutines;
  });
};

  // ✅ TRUE IN-PLACE EDIT FUNCTION
  const updateRoutine = async (updatedRoutine: Routine) => {
    try {
      // Use functional state update to guarantee we have the absolute latest state
      setCustomRoutines((prev) => {
        const nextRoutines = prev.map((r) => (r.id === updatedRoutine.id ? updatedRoutine : r));
        AsyncStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(nextRoutines)).catch((e) =>
          console.error("Failed to sync async storage on update", e)
        );
        return nextRoutines;
      });
    } catch (e) {
      console.error("Failed to update routine", e);
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      if (id.startsWith("custom-")) {
        const updated = customRoutines.filter((r) => r.id !== id);
        setCustomRoutines(updated);
        await AsyncStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(updated));
      } else {
        const updated = [...deletedStarterIds, id];
        setDeletedStarterIds(updated);
        await AsyncStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(updated));
      }
    } catch (e) {
      console.error("Failed to delete routine", e);
    }
  };

  return (
    <RoutineContext.Provider
      value={{
        customRoutines,
        deletedStarterIds,
        addRoutine,
        updateRoutine, // ✅ Exposed here
        deleteRoutine,
        isLoading,
      }}
    >
      {children}
    </RoutineContext.Provider>
  );
};

export const useRoutines = () => {
  const context = useContext(RoutineContext);
  if (!context) throw new Error("useRoutines must be used within a RoutineProvider");
  return context;
};