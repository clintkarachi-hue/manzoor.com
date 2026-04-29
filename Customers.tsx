import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  enableDeletion: boolean;
  toggleDeletion: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  enableDeletion: false,
  toggleDeletion: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [enableDeletion, setEnableDeletion] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
      if (docSnap.exists()) {
        setEnableDeletion(!!docSnap.data().enableDeletion);
      }
    });
    return unsub;
  }, []);

  const toggleDeletion = async () => {
    if (user?.role !== 'super_admin') return;
    try {
      await setDoc(doc(db, 'settings', 'system'), { enableDeletion: !enableDeletion }, { merge: true });
    } catch (error) {
      console.error(error);
      alert("Failed to toggle setting. You might not have permission.");
    }
  };

  return (
    <SettingsContext.Provider value={{ enableDeletion, toggleDeletion }}>
      {children}
    </SettingsContext.Provider>
  );
};
