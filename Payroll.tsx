import React, { useState } from 'react';
import { useBranch, Branch } from '../context/BranchContext';
import { collection, addDoc, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, secondaryAuth } from '../lib/firebase';
import { Plus, Building, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export function Branches() {
  const { branches, loading } = useBranch();
  const { user } = useAuth();
  const { enableDeletion } = useSettings();
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create User in Auth using secondary app to avoid logging out super admin
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, adminEmail, password);
      const newUid = userCredential.user.uid;
      
      // We sign out the secondary auth right away to keep it clean
      await signOut(secondaryAuth);

      // 2. Create the branch document
      const branchRef = await addDoc(collection(db, 'branches'), {
        name,
        color,
        adminEmail,
        createdAt: serverTimestamp(),
        tenantId: user?.tenantId || user?.uid
      });

      // 3. Create the user profile in Firestore
      await setDoc(doc(db, 'users', newUid), {
        email: adminEmail,
        name: adminName,
        role: 'branch_admin',
        branchId: branchRef.id,
        tenantId: user?.tenantId || user?.uid,
        createdAt: serverTimestamp()
      });

      // Reset form
      setShowForm(false);
      setName('');
      setAdminEmail('');
      setAdminName('');
      setPassword('');
      setColor('#3b82f6');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!enableDeletion || user?.role !== 'super_admin') return;
    if (confirm("Are you sure you want to delete this branch? Note: Admin user needs to be manually deleted from Users & Logins.")) {
      try {
        await deleteDoc(doc(db, 'branches', id));
      } catch (err: any) {
        alert("Failed to delete branch: " + err.message);
      }
    }
  };

  if (loading) return <div>Loading branches...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Manage Branches</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Branch
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Create New Branch & Admin</h3>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <form onSubmit={handleCreateBranch} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Branch Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g. Branch 2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Branch Color (Hex)</label>
                <div className="mt-1 flex items-center space-x-2">
                  <input required type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-9 rounded-md border border-slate-300 p-0 shadow-sm" />
                  <input required type="text" value={color} onChange={e => setColor(e.target.value)} className="block w-full text-slate-500 rounded-md border-slate-300 shadow-sm border py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                </div>
              </div>
            </div>
            
            <h4 className="text-md font-medium text-slate-700 pt-4 border-t border-slate-100">Branch Admin Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Admin Full Name</label>
                <input required type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Admin Email</label>
                <input required type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700">Admin Password</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="card p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: branch.color }}></div>
            <div className="flex items-center justify-between mb-4 pl-2">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Building className="w-5 h-5 mr-3 text-slate-400" />
                {branch.name}
              </h3>
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: branch.color }}></span>
                {user?.role === 'super_admin' && enableDeletion && (
                  <button onClick={() => handleDelete(branch.id)} className="text-slate-300 hover:text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="pl-[28px] space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Admin Details</div>
              <p className="text-sm font-medium text-slate-700"> 
                {branch.adminEmail}
              </p>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-3 pt-3 border-t border-slate-100">System ID</div>
              <p className="text-xs font-mono text-slate-500">{branch.id}</p>
            </div>
          </div>
        ))}
        {branches.length === 0 && !showForm && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
            No branches found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
