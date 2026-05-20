import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// We add <T> here so it can accept and adapt to any type array passed into it safely
export function usePersistentState<T>(key: string, initialValue: T[]): [T[], (value: T[]) => void] {
  const [state, setState] = useState<T[]>(initialValue);

  // Load from disk on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(key);
        if (jsonValue != null) {
          // Explicit type assertion to keep the compiler happy
          setState(JSON.parse(jsonValue) as T[]);
        }
      } catch (e) {
        console.error("Failed to load search history from disk:", e);
      }
    };
    loadPersistedData();
  }, [key]);

  // Save changes to disk
  const setPersistedState = async (newValue: T[]) => {
    try {
      setState(newValue);
      const jsonValue = JSON.stringify(newValue);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error("Failed to save search history to disk:", e);
    }
  };

  return [state, setPersistedState];
}