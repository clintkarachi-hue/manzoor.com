import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'super_admin' | 'branch_admin' | 'staff' | 'billing_only';

export interface AppUser {
  uid: string;
  email: string | null;
  name: string;
  role: UserRole;
  branchId?: string | null;
  tenantId: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const unsubDoc = onSnapshot(doc(db, 'users', fUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({ uid: fUser.uid, ...data, tenantId: data.tenantId || fUser.uid } as AppUser);
          } else {
            const newAppUser: AppUser = {
              uid: fUser.uid,
              email: fUser.email,
              name: fUser.displayName || 'User',
              role: 'super_admin',
              branchId: null,
              tenantId: fUser.uid,
            };
            setUser(newAppUser);
            setDoc(doc(db, 'users', fUser.uid), newAppUser).catch(e => {
              console.error("Could not bootstrap user (might not be first user or rules blocked it):", e);
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("AuthContext onSnapshot error:", error);
          setLoading(false);
        });
        return unsubDoc;
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
