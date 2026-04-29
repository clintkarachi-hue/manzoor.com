import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Branch {
  id: string;
  name: string;
  color: string;
  adminEmail: string;
}

interface BranchContextType {
  branches: Branch[];
  activeBranchId: string | null; // null means 'All Branches'
  setActiveBranchId: (id: string | null) => void;
  loading: boolean;
}

const BranchContext = createContext<BranchContextType>({
  branches: [],
  activeBranchId: null,
  setActiveBranchId: () => {},
  loading: true,
});

export const useBranch = () => useContext(BranchContext);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) return; // Wait for auth
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Automatically set active branch for standard users
    if (user.role !== 'super_admin' && user.branchId) {
      setActiveBranchId(user.branchId);
    } else {
      // Super admin starts with 'All branches' (null)
      // or we can leave it null.
    }

    const q = collection(db, 'branches');
    const unsub = onSnapshot(q, (snap) => {
      const bList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
      setBranches(bList);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  return (
    <BranchContext.Provider value={{ branches, activeBranchId, setActiveBranchId, loading }}>
      {children}
    </BranchContext.Provider>
  );
}
