import { UsersRound, Plus, Trash2, Edit2, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { useSettings } from '../context/SettingsContext';
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { printInvoice } from '../lib/print';

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  dailyWage: number;
  monthlySalary: number;
  advanceBalance?: number;
  status: 'active' | 'inactive';
  branchId: string;
}

export function Employees() { 
  const { user } = useAuth();
  const { activeBranchId, branches } = useBranch();
  const { enableDeletion } = useSettings();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Advance Modal State
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceEmp, setAdvanceEmp] = useState<Employee | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDesc, setAdvanceDesc] = useState('');
  const [advanceHistory, setAdvanceHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Labour');
  const [phone, setPhone] = useState('');
  const [wage, setWage] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!showAdvanceModal || !advanceEmp) {
      setAdvanceHistory([]);
      return;
    }

    setLoadingHistory(true);
    let isSubscribed = true;

    const fetchHistory = async () => {
      try {
        const ledgerQuery = query(collection(db, 'ledger'), where('reference', '==', 'Advance'));
        const payrollQuery = query(collection(db, 'payroll'), where('employeeId', '==', advanceEmp.id), where('advances', '>', 0));

        const [ledgerSnap, payrollSnap] = await Promise.all([
          getDocs(ledgerQuery),
          getDocs(payrollQuery)
        ]);

        if (!isSubscribed) return;

        const history: any[] = [];

        ledgerSnap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.employeeId === advanceEmp.id || (data.description && data.description.includes(advanceEmp.name))) {
             history.push({
               id: docSnap.id,
               date: data.date,
               type: 'issue',
               amount: data.amount,
               desc: data.description,
               refId: docSnap.id
             });
          }
        });

        payrollSnap.forEach(docSnap => {
          const data = docSnap.data();
          history.push({
            id: `payroll-${docSnap.id}`,
            date: data.date,
            type: 'deduction',
            amount: data.advances,
            desc: `Payroll Deduction (${data.period})`,
            refId: docSnap.id
          });
        });

        history.sort((a, b) => b.date - a.date);
        setAdvanceHistory(history);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        if (isSubscribed) setLoadingHistory(false);
      }
    };

    fetchHistory();

    return () => { isSubscribed = false; };
  }, [showAdvanceModal, advanceEmp]);

  useEffect(() => {
    if (showAdd && !selectedBranchId) {
      if (activeBranchId) setSelectedBranchId(activeBranchId);
      else if (branches.length > 0) setSelectedBranchId(branches[0].id);
    }
  }, [showAdd, activeBranchId, branches]);

  useEffect(() => {
    if (user?.role !== 'super_admin' && !activeBranchId) return;

    const q = user?.role === 'super_admin' && !activeBranchId
      ? collection(db, 'employees')
      : query(collection(db, 'employees'), where('branchId', '==', activeBranchId));

    const unsub = onSnapshot(q, (snap) => {
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    });
    return unsub;
  }, [user, activeBranchId]);

  const resetForm = () => {
    setName('');
    setRole('Labour');
    setPhone('');
    setWage('');
    setMonthlySalary('');
    setStatus('active');
    setEditingId(null);
    setShowAdd(false);
  };

  const handleEditInit = (emp: Employee) => {
    setName(emp.name);
    setRole(emp.role);
    setPhone(emp.phone || '');
    setWage(emp.dailyWage?.toString() || '');
    setMonthlySalary(emp.monthlySalary?.toString() || '');
    setStatus(emp.status || 'active');
    setEditingId(emp.id);
    setShowAdd(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const branchToUse = selectedBranchId || activeBranchId;
    if (!branchToUse) {
      alert("Please select a specific branch to add employees.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'employees', editingId), {
          name,
          role,
          phone,
          dailyWage: Number(wage) || 0,
          monthlySalary: Number(monthlySalary) || 0,
          status,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'employees'), {
          branchId: branchToUse,
          name,
          role,
          phone,
          dailyWage: Number(wage) || 0,
          monthlySalary: Number(monthlySalary) || 0,
          status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tenantId: user?.tenantId || user?.uid
        });
      }
      resetForm();
      setSelectedBranchId(activeBranchId || '');
    } catch (err: any) {
      alert("Error saving employee: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this employee/labour?")) {
      try {
        await deleteDoc(doc(db, 'employees', id));
      } catch(err: any) {
        alert("Error deleting employee: " + err.message);
      }
    }
  };

  const handleAddAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceEmp || !advanceAmount) return;
    setIsSubmitting(true);
    try {
      const amount = Number(advanceAmount);
      // Update employee's advance balance
      await updateDoc(doc(db, 'employees', advanceEmp.id), {
        advanceBalance: (advanceEmp.advanceBalance || 0) + amount,
        updatedAt: serverTimestamp()
      });
      // Add to Ledger as Cash OUT
      await addDoc(collection(db, 'ledger'), {
        branchId: advanceEmp.branchId,
        employeeId: advanceEmp.id,
        date: new Date().getTime(),
        description: `Advance to ${advanceEmp.name} ${advanceDesc ? '('+advanceDesc+')' : ''}`,
        category: 'Payment',
        type: 'OUT',
        amount: amount,
        reference: 'Advance',
        createdAt: serverTimestamp(),
        tenantId: user?.tenantId || user?.uid
      });
      setShowAdvanceModal(false);
      setAdvanceEmp(null);
      setAdvanceAmount('');
      setAdvanceDesc('');
    } catch (err: any) {
      alert("Error adding advance: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalGrossSalary = employees
    .filter(emp => emp.status === 'active')
    .reduce((sum, emp) => sum + (emp.monthlySalary || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center mb-2 md:mb-0">
            <UsersRound className="w-6 h-6 mr-3 text-blue-600" />
            Payroll & Staff (Labour)
          </h2>
          <div className="md:hidden mt-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 flex items-center">
             <span className="text-slate-400 uppercase tracking-widest text-[10px] mr-2">Total Gross Salary:</span>
             <span className="font-bold text-slate-800 font-mono">PKR {totalGrossSalary.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 w-full md:w-auto mt-4 md:mt-0">
          <div className="hidden md:flex flex-col items-end px-4 py-1.5 bg-slate-50 rounded-md border border-slate-100">
             <span className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Total Gross Salary</span>
             <span className="font-bold text-slate-800 font-mono">PKR {totalGrossSalary.toLocaleString()}</span>
          </div>
          <button
            onClick={() => printInvoice('employees-print-content', 'Staff & Labour List', 'a4')}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition shadow-sm print:hidden"
          >
            <Printer className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Print</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowAdd(!showAdd); }}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-[#1e293b] text-sky-400 font-medium rounded-md hover:bg-slate-800 transition shadow-sm print:hidden"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Labour / Employee
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSave} className="card p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 print:hidden">
          {user?.role === 'super_admin' && !activeBranchId && (
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-6 mb-2">
              <label className="block text-sm font-medium text-slate-700">Assign to Branch *</label>
              <select 
                required 
                value={selectedBranchId} 
                onChange={e => setSelectedBranchId(e.target.value)} 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="" disabled>Select a branch</option>
                <option value="main">Main Branch (HQ)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option value="Labour">Labour</option>
              <option value="Staff">Staff</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">Daily Wage</label>
            <input type="number" value={wage} onChange={e => setWage(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700">Monthly Salary</label>
            <input type="number" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="lg:col-span-1 xl:col-span-1 flex items-end space-x-2">
            <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </button>
            <button type="button" onClick={resetForm} disabled={isSubmitting} className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div id="employees-print-content" className="space-y-6 print:space-y-4 print:bg-white print:p-8 print:w-full print:absolute print:left-0 print:top-0 print:z-50 print:h-full">
        <div className="hidden print:block text-center border-b border-slate-200 pb-4 mb-4">
          <h1 className="text-2xl font-bold font-serif uppercase tracking-widest text-slate-900">
            {activeBranchId === 'main' ? 'Main Branch' : (branches.find(b => b.id === activeBranchId)?.name || 'Branch')}
          </h1>
          <h2 className="text-lg font-bold text-slate-700 mt-1 uppercase tracking-widest">Labour & Staff List</h2>
          <p className="text-xs text-slate-400 mt-2">Printed on {new Date().toLocaleString()}</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Daily Wage</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Monthly Salary</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Advance(Dr)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No labour or employees found for this branch. Click "Add Labour" to create one.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{emp.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        emp.role === 'Labour' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{emp.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right font-medium">Rs {emp.dailyWage?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right font-medium">Rs {emp.monthlySalary?.toLocaleString() || '0'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 text-right font-medium">{emp.advanceBalance ? `Rs ${emp.advanceBalance.toLocaleString()}` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm print:hidden">
                      <button onClick={() => { setAdvanceEmp(emp); setShowAdvanceModal(true); }} className="text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-xs mr-2 transition-colors">
                        Add Advance
                      </button>
                      <button onClick={() => handleEditInit(emp)} className="text-blue-600 hover:text-blue-900 mx-2"><Edit2 className="w-4 h-4" /></button>
                      {user?.role === 'super_admin' && enableDeletion && (
                        <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {showAdvanceModal && advanceEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-semibold text-slate-800">Issue Advance to {advanceEmp.name}</h3>
              <button 
                onClick={() => setShowAdvanceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <form onSubmit={handleAddAdvance} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Current Advance Balance
                  </label>
                  <div className="text-lg font-mono font-bold text-rose-600">
                    {advanceEmp.advanceBalance ? `Rs ${advanceEmp.advanceBalance.toLocaleString()}` : 'Rs 0'}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    New Advance Amount (Rs)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g. 5000"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description / Note
                  </label>
                  <input
                    type="text"
                    value={advanceDesc}
                    onChange={(e) => setAdvanceDesc(e.target.value)}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Optional note"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Issue Advance'}
                  </button>
                </div>
              </form>

              <div className="p-6 bg-slate-50 flex flex-col h-[400px]">
                <h4 className="font-semibold text-slate-700 mb-4 flex items-center">
                  Advance History
                  {loadingHistory && <span className="ml-3 text-xs text-blue-500 animate-pulse">Loading...</span>}
                </h4>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {advanceHistory.length === 0 && !loadingHistory ? (
                    <div className="text-sm text-slate-500 text-center py-8">
                      No advance history found.
                    </div>
                  ) : (
                    advanceHistory.map(record => (
                      <div key={record.id} className="bg-white p-3 rounded border border-slate-200 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-medium ${record.type === 'issue' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {record.type === 'issue' ? 'Issued' : 'Deducted'} Rs {record.amount.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(record.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {record.desc}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  ); 
}
