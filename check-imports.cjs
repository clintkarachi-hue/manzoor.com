import React, { useState, useEffect } from 'react';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BookText, Plus, ArrowDownRight, ArrowUpRight, Filter, Printer, Trash2 } from 'lucide-react';
import { printInvoice } from '../lib/print';
import { useLocation } from 'react-router';

interface LedgerEntry {
  id: string;
  branchId: string;
  customerId?: string | null;
  vendorId?: string | null;
  date: number;
  description: string;
  category: string;
  type: 'IN' | 'OUT';
  amount: number;
  reference: string;
  createdAt: any;
}

export function Ledger() {
  const { user } = useAuth();
  const { activeBranchId, branches } = useBranch();
  const { enableDeletion } = useSettings();
  const location = useLocation();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState((location.state as any)?.searchCustomer || '');
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const [vendors, setVendors] = useState<{id: string, name: string}[]>([]);

  // View modes
  const [viewMode, setViewMode] = useState<'general' | 'customer' | 'vendor'>((location.state as any)?.viewMode || 'general');
  const [selectedCustomerIdFilter, setSelectedCustomerIdFilter] = useState((location.state as any)?.customerId || '');
  const [selectedVendorIdFilter, setSelectedVendorIdFilter] = useState((location.state as any)?.vendorId || '');

  // Form state
  const [targetBranchId, setTargetBranchId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [description, setDescription] = useState('');
  const [accountType, setAccountType] = useState<'customer' | 'vendor' | 'general'>('customer');
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [amount, setAmount] = useState<number | ''>('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (user?.role !== 'super_admin' && !activeBranchId) return;

    let q: any = collection(db, 'ledger');
    let custQ: any = collection(db, 'customers');
    let vendQ: any = collection(db, 'vendors');
    
    if (activeBranchId) {
      q = query(q, where('branchId', '==', activeBranchId));
      custQ = query(custQ, where('branchId', '==', activeBranchId));
      vendQ = query(vendQ, where('branchId', '==', activeBranchId));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as LedgerEntry))
        // Sort by date ascending (oldest first) to calculate running balance properly downward
        .sort((a, b) => {
          if (a.date !== b.date) return a.date - b.date;
          // if same date, use createdAt timestamp to ensure correct order
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return aTime - bTime;
        });
      setEntries(data);
    });

    const unsubCust = onSnapshot(custQ, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
    });

    const unsubVend = onSnapshot(vendQ, (snap) => {
      setVendors(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
    });
    
    return () => { unsubscribe(); unsubCust(); unsubVend(); };
  }, [activeBranchId]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchToUse = activeBranchId || targetBranchId;
    if (!branchToUse) {
      alert("Please select a branch first");
      return;
    }

    if (!description || !amount) return;

    try {
      let category = type === 'IN' ? 'Receipt' : 'Payment';
      
      let custId = accountType === 'customer' ? selectedCustomerId : null;
      let vendId = accountType === 'vendor' ? selectedVendorId : null;

      await addDoc(collection(db, 'ledger'), {
        branchId: branchToUse,
        customerId: custId || null,
        vendorId: vendId || null,
        date: new Date(transactionDate).getTime(),
        description: description,
        category,
        type,
        amount: Number(amount),
        reference: '',
        createdAt: serverTimestamp(),
        tenantId: user?.tenantId || user?.uid
      });
      setShowAdd(false);
      setDescription('');
      setAmount('');
      setTransactionDate(new Date().toISOString().slice(0, 10));
      setSelectedCustomerId('');
      setSelectedVendorId('');
      setType('IN');
      setAccountType('customer');
    } catch (error) {
      console.error(error);
      alert("Failed to add transaction");
    }
  };

  const handleDeleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enableDeletion || user?.role !== 'super_admin') return;
    if (confirm("Are you sure you want to delete this ledger entry?")) {
      try {
        await deleteDoc(doc(db, 'ledger', id));
      } catch (err: any) {
        alert("Failed to delete entry: " + err.message);
      }
    }
  };

  const filteredEntries = entries.filter(e => {
    // Mode filters
    if (viewMode === 'customer' && selectedCustomerIdFilter && e.customerId !== selectedCustomerIdFilter) return false;
    if (viewMode === 'vendor' && selectedVendorIdFilter && e.vendorId !== selectedVendorIdFilter) return false;

    // Type filters
    const typeMatch = filterType === 'ALL' || e.type === filterType;
    
    // Search filter
    const searchMatch = (() => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const inDesc = e.description.toLowerCase().includes(q);
      const inRef = e.reference?.toLowerCase().includes(q);
      
      let inCustomer = false;
      if (e.customerId) {
        const c = customers.find(c => c.id === e.customerId);
        if (c && c.name.toLowerCase().includes(q)) inCustomer = true;
      }
      
      let inVendor = false;
      if (e.vendorId) {
        const v = vendors.find(v => v.id === e.vendorId);
        if (v && v.name.toLowerCase().includes(q)) inVendor = true;
      }

      return inDesc || !!inRef || inCustomer || inVendor;
    })();
    
    return typeMatch && searchMatch;
  });
  
  const totalIn = filteredEntries.filter(e => e.type === 'IN').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = filteredEntries.filter(e => e.type === 'OUT').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIn - totalOut;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center card p-4 print:hidden">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center">
           Ledger / Cashbook
        </h2>
        
        <div className="flex items-center space-x-4">
          <button onClick={() => printInvoice('ledger-print-content', 'Ledger Report', 'a4')} className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition shadow-sm">
            <Printer className="w-5 h-5 mr-2" /> Print
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center px-4 py-2 bg-[#1e293b] text-sky-400 rounded-md hover:bg-slate-800 transition shadow-sm">
            <Plus className="w-5 h-5 mr-2" /> New Transaction
          </button>
        </div>
      </div>

      <div id="ledger-print-content" className="space-y-6 print:space-y-4 print:bg-white print:p-8 print:w-full print:absolute print:left-0 print:top-0 print:z-50 print:h-full">
        {/* Print Header inside content */}
        <div className="hidden print:block text-center border-b border-slate-200 pb-4 mb-4">
          <h1 className="text-2xl font-bold font-serif uppercase tracking-widest text-slate-900">
            {activeBranchId === 'main' ? 'Main Branch' : (branches.find(b => b.id === activeBranchId)?.name || 'Branch')}
          </h1>
          <h2 className="text-lg font-bold text-slate-700 mt-1 uppercase tracking-widest">
            {viewMode === 'general' ? 'Ledger / Cashbook Report' : viewMode === 'customer' ? 'Customer Ledger Report' : 'Vendor Ledger Report'}
          </h2>
          <p className="text-xs text-slate-400 mt-2">Printed on {new Date().toLocaleDateString()}</p>
        </div>

      {showAdd && (
        <div className="card p-6 bg-slate-50 print:hidden">
          <h3 className="font-semibold mb-4 text-slate-800 border-b border-slate-200 pb-2">Record Transaction</h3>
          <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!activeBranchId && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Branch</label>
                <select 
                  required
                  value={targetBranchId} 
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="" disabled>Select Branch</option>
                  <option value="main">Main Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Account Type</label>
              <select 
                value={accountType} 
                onChange={(e: any) => { setAccountType(e.target.value); setSelectedCustomerId(''); setSelectedVendorId(''); }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="general">Other / General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Transaction Nature</label>
              <select 
                value={type} 
                onChange={(e: any) => setType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
              >
                <option value="IN">Credit (Receipt / Money In)</option>
                <option value="OUT">Debit (Payment / Money Out)</option>
              </select>
            </div>
            {accountType === 'customer' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Account Title (Customer)</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="" disabled>Select Customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {accountType === 'vendor' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Account Title (Vendor)</label>
                <select
                  required
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="" disabled>Select Vendor...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input 
                type="text" 
                required 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                placeholder="Enter description details..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Amount (PKR)</label>
              <input 
                type="number" 
                required 
                min="0"
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full md:w-1/2 rounded-md border border-slate-300 px-3 py-2 bg-white"
                placeholder="Enter amount"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-white border border-slate-300 rounded font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition">Save Transaction</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto print:hidden">
          <button onClick={() => setViewMode('general')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === 'general' ? 'border-sky-600 text-sky-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            General Ledger
          </button>
          <button onClick={() => setViewMode('customer')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === 'customer' ? 'border-sky-600 text-sky-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            Customer Ledger
          </button>
          <button onClick={() => setViewMode('vendor')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === 'vendor' ? 'border-sky-600 text-sky-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            Vendor Ledger
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
            {viewMode === 'customer' && (
              <select 
                value={selectedCustomerIdFilter} 
                onChange={(e) => setSelectedCustomerIdFilter(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white print:hidden focus:outline-none focus:ring-1 focus:ring-slate-300"
              >
                <option value="">All Customers</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {viewMode === 'vendor' && (
              <select 
                value={selectedVendorIdFilter} 
                onChange={(e) => setSelectedVendorIdFilter(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white print:hidden focus:outline-none focus:ring-1 focus:ring-slate-300"
              >
                <option value="">All Vendors</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            )}
            
            <div className="flex rounded-md border border-slate-200 text-xs overflow-hidden print:hidden">
              <button onClick={() => setFilterType('ALL')} className={`px-3 py-1.5 ${filterType === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>All</button>
              <button onClick={() => setFilterType('IN')} className={`px-3 py-1.5 border-l border-slate-200 ${filterType === 'IN' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Cash In</button>
              <button onClick={() => setFilterType('OUT')} className={`px-3 py-1.5 border-l border-slate-200 ${filterType === 'OUT' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Cash Out</button>
            </div>
          </div>
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <input 
              type="text" 
              placeholder="Search by description, reference, customer, or vendor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition duration-150 ease-in-out print:hidden shadow-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Particulars</th>
                <th className="p-3 font-medium">Ref</th>
                <th className="p-3 font-medium text-right">Cash In (Dr)</th>
                <th className="p-3 font-medium text-right">Cash Out (Cr)</th>
                <th className="p-3 font-medium text-right">Balance</th>
                <th className="p-3 font-medium text-right print:hidden">Branch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(() => {
                let rollingBalance = 0;
                const entriesWithBalance = filteredEntries.map(entry => {
                  if (entry.type === 'IN') rollingBalance += entry.amount;
                  else rollingBalance -= entry.amount;
                  return { ...entry, runningBalance: rollingBalance };
                });
                
                const reversedEntries = [...entriesWithBalance].reverse();
                
                return reversedEntries.length > 0 ? reversedEntries.map((entry) => {
                  const bName = entry.branchId === 'main' ? 'Main Branch' : branches.find(b => b.id === entry.branchId)?.name || 'Unknown';
                  
                  const rowBalance = entry.runningBalance;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-3 text-sm text-slate-700 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span>{entry.description}</span>
                          <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">{entry.category}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-slate-500 font-mono">
                        {entry.vendorId 
                          ? vendors.find(v => v.id === entry.vendorId)?.name || entry.reference || '-' 
                          : entry.customerId 
                            ? customers.find(c => c.id === entry.customerId)?.name || entry.reference || '-' 
                            : entry.reference || '-'}
                      </td>
                      <td className="p-3 text-sm text-right font-mono font-medium text-emerald-600">
                        {entry.type === 'IN' ? entry.amount.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 text-sm text-right font-mono font-medium text-rose-600">
                        {entry.type === 'OUT' ? entry.amount.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 text-sm text-right font-mono font-bold text-slate-700 relative">
                        {rowBalance < 0 ? `-${Math.abs(rowBalance).toLocaleString()}` : rowBalance > 0 ? `+${rowBalance.toLocaleString()}` : '0'}
                        {user?.role === 'super_admin' && enableDeletion && (
                          <button 
                            onClick={(e) => handleDeleteEntry(entry.id, e)} 
                            className="absolute right-0 opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 ml-2"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-xs text-slate-500 text-right opacity-70 print:hidden">
                        {bName}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-slate-500">
                      No transactions found.
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
