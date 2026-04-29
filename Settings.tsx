import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Plus, Trash2, Mail, Phone, MapPin } from 'lucide-react';

interface Customer {
  id: string;
  branchId: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  createdAt: any;
}

import { useSettings } from '../context/SettingsContext';

export function Customers() {
  const { user } = useAuth();
  const { activeBranchId, branches } = useBranch();
  const { enableDeletion } = useSettings();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showAdd && !selectedBranchId) {
      if (activeBranchId) setSelectedBranchId(activeBranchId);
      else if (branches.length > 0) setSelectedBranchId(branches[0].id);
    }
  }, [showAdd, activeBranchId, branches]);

  useEffect(() => {
    if (user?.role !== 'super_admin' && !activeBranchId) return;

    let q: any = collection(db, 'customers');
    if (activeBranchId) {
      q = query(q, where('branchId', '==', activeBranchId));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    });
    
    return () => unsubscribe();
  }, [activeBranchId]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const branchToUse = selectedBranchId || activeBranchId;
    if (!branchToUse) {
      alert("Please select a specific branch to add a customer.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'customers'), {
        branchId: branchToUse,
        name,
        phone,
        email,
        address,
        createdAt: serverTimestamp(),
        tenantId: user?.tenantId || user?.uid
      });
      setShowAdd(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setSelectedBranchId(activeBranchId || '');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteDoc(doc(db, 'customers', id));
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center card p-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center">
          <Users className="w-5 h-5 mr-3 text-slate-500" />
          Customer Directory
        </h2>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center px-4 py-2 bg-[#1e293b] text-sky-400 rounded-md hover:bg-slate-800 transition shadow-sm">
          <Plus className="w-5 h-5 mr-2" /> Add Customer
        </button>
      </div>

      {showAdd && (
        <div className="card p-6 bg-slate-50">
          <h3 className="font-semibold mb-4 text-slate-800 border-b border-slate-200 pb-2">New Customer Profile</h3>
          <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.role === 'super_admin' && !activeBranchId && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Assign to Branch *</label>
                <select 
                  required 
                  value={selectedBranchId} 
                  onChange={e => setSelectedBranchId(e.target.value)} 
                  className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="" disabled>Select a branch</option>
                  <option value="main">Main Branch (HQ)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white" placeholder="Customer Name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
              <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white" placeholder="+92 300 1234567" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white" placeholder="customer@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Shipping / Billing Address</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white" placeholder="Street, City" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} disabled={isSubmitting} className="px-4 py-2 bg-white border border-slate-300 rounded font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-sky-600 text-white rounded font-medium hover:bg-sky-700 transition disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {customers.map(c => {
          const bName = branches.find(b => b.id === c.branchId)?.name || 'Unknown Branch';
          return (
            <div key={c.id} className="card p-5 group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg mr-3">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{c.name}</h3>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">{bName}</div>
                  </div>
                </div>
                {user?.role === 'super_admin' && enableDeletion && (
                  <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center text-sm text-slate-600">
                  <Phone className="w-4 h-4 mr-2 text-slate-400" />
                  {c.phone}
                </div>
                {c.email && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                    {c.email}
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {c.address}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                 <span className="text-slate-400 font-mono">ID: {c.id.substring(0,6)}</span>
                 <span onClick={() => navigate('/ledger', { state: { viewMode: 'customer', customerId: c.id } })} className="text-sky-600 font-medium hover:underline cursor-pointer">View Ledger History</span>
              </div>
            </div>
          );
        })}
        {customers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 card border-dashed">
            No customers found. Click "Add Customer" to begin building your CRM.
          </div>
        )}
      </div>
    </div>
  );
}
