import React, { useState, useEffect } from 'react';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { collection, query, where, onSnapshot, serverTimestamp, runTransaction, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Printer, X, Receipt, Building2, Trash2 } from 'lucide-react';
import { printInvoice } from '../lib/print';

interface Purchase {
  id: string;
  branchId: string;
  vendorName: string;
  total: number;
  items: Array<{ id: string, name: string, qty: number, price: number, salePrice?: number }>;
  createdAt: any;
  date?: number;
  paymentMethod?: 'Cash' | 'Online';
  paymentAccount?: string;
  vendorId?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
}

interface Vendor {
  id: string;
  name: string;
}

export function Purchases() {
  const { user } = useAuth();
  const { activeBranchId, branches } = useBranch();
  const { enableDeletion } = useSettings();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const [printPurchase, setPrintPurchase] = useState<Purchase | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetBranchId, setTargetBranchId] = useState('');

  // Bill logic
  const [selectedVendor, setSelectedVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{ id: string, name: string, qty: number, price: number, salePrice: number }>>([]);
  
  const [currentItem, setCurrentItem] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  const [currentCostPrice, setCurrentCostPrice] = useState(0);
  const [currentSalePrice, setCurrentSalePrice] = useState(0);

  useEffect(() => {
    if (user?.role !== 'super_admin' && !activeBranchId) return;

    let q: any = collection(db, 'purchases');
    let invQ: any = collection(db, 'inventory');
    let venQ: any = collection(db, 'vendors');

    if (activeBranchId) {
      q = query(q, where('branchId', '==', activeBranchId));
      invQ = query(invQ, where('branchId', '==', activeBranchId));
      venQ = query(venQ, where('branchId', '==', activeBranchId));
    }

    const unsubPurchases = onSnapshot(q, (snap) => setPurchases(snap.docs.map(d => ({ id: d.id, ...d.data() } as Purchase))));
    const unsubInv = onSnapshot(invQ, (snap) => setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))));
    const unsubVen = onSnapshot(venQ, (snap) => setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor))));
    
    return () => { unsubPurchases(); unsubInv(); unsubVen(); };
  }, [activeBranchId, user]);

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCurrentItem(val);
    if (!val) {
      setCurrentCostPrice(0);
      setCurrentSalePrice(0);
      return;
    }
    const item = inventory.find(i => i.id === val);
    if (item) {
      setCurrentCostPrice(item.cost || Math.round(item.price * 0.6));
      setCurrentSalePrice(item.price || 0);
    }
  };

  const handleAddItem = () => {
    const item = inventory.find(i => i.id === currentItem);
    if (!item) return;
    if (currentQty <= 0 || isNaN(currentQty)) {
      alert("Quantity must be greater than zero.");
      return;
    }
    if (isNaN(currentCostPrice) || currentCostPrice < 0) {
      alert("Invalid cost price.");
      return;
    }
    if (isNaN(currentSalePrice) || currentSalePrice < 0) {
      alert("Invalid sale price.");
      return;
    }
    setSelectedItems([...selectedItems, { id: item.id, name: item.name, qty: currentQty, price: currentCostPrice, salePrice: currentSalePrice }]);
    setCurrentItem('');
    setCurrentQty(1);
    setCurrentCostPrice(0);
    setCurrentSalePrice(0);
  };

  const handleCheckout = async () => {
    if (isSubmitting) return;
    const branchToUse = activeBranchId || targetBranchId;
    if (!branchToUse) {
      alert("Select a branch first to record a vendor bill."); return;
    }
    if (selectedItems.length === 0) return;
    if (paymentMethod === 'Online' && !paymentAccount.trim()) {
      alert("Please specify the online payment account details."); return;
    }

    setIsSubmitting(true);
    const total = selectedItems.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
    const vendorLookup = vendors.find(v => v.id === selectedVendor);
    const vendorName = vendorLookup ? vendorLookup.name : 'Unknown Vendor';

    try {
      await runTransaction(db, async (transaction) => {
        const invRefs = selectedItems.map(item => ({ ref: doc(db, 'inventory', item.id), ...item }));
        const currentInvDocs = await Promise.all(invRefs.map(item => transaction.get(item.ref)));
        
        currentInvDocs.forEach((docSnap, idx) => {
          if (!docSnap.exists()) {
            throw new Error(`Inventory item ${invRefs[idx].name} not found.`);
          }
        });

        // Add to stock and update cost + retail price
        currentInvDocs.forEach((docSnap, idx) => {
          transaction.update(invRefs[idx].ref, { 
            stock: docSnap.data().stock + invRefs[idx].qty,
            cost: invRefs[idx].price,
            price: invRefs[idx].salePrice
          });
        });

        const newPurchaseRef = doc(collection(db, 'purchases'));
        transaction.set(newPurchaseRef, {
          branchId: branchToUse,
          vendorId: selectedVendor || null,
          vendorName: vendorName,
          paymentMethod,
          paymentAccount: paymentMethod === 'Online' ? paymentAccount : null,
          total,
          items: selectedItems,
          date: new Date().getTime(),
          createdAt: serverTimestamp(),
          tenantId: user?.tenantId || user?.uid
        });

        const newLedgerRef = doc(collection(db, 'ledger'));
        transaction.set(newLedgerRef, {
          branchId: branchToUse,
          vendorId: selectedVendor || null,
          date: new Date().getTime(),
          description: `Vendor Bill: ${vendorName}`,
          category: 'Purchase Payment',
          type: 'OUT',
          amount: total,
          reference: `Bill #${newPurchaseRef.id.substring(0,6).toUpperCase()} - ${paymentMethod}${paymentMethod === 'Online' ? ` (${paymentAccount})` : ''}`,
          createdAt: serverTimestamp(),
          tenantId: user?.tenantId || user?.uid
        });
      });

      setShowAdd(false);
      setSelectedVendor('');
      setPaymentMethod('Cash');
      setPaymentAccount('');
      setSelectedItems([]);
      alert('Vendor Bill saved successfully!');
    } catch (e: any) {
      console.error("Purchase Transaction Failed: ", e);
      alert("Failed to save vendor bill: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePurchase = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enableDeletion || user?.role !== 'super_admin') return;
    if (confirm("Are you sure you want to delete this bill? This will NOT revert stock automatically.")) {
      try {
        await deleteDoc(doc(db, 'purchases', id));
      } catch (err: any) {
        alert("Failed to delete bill: " + err.message);
      }
    }
  };

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="flex justify-between items-center card p-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center">
             <Building2 className="w-6 h-6 mr-3 text-emerald-600" />
             Vendor Bills & Purchases
          </h2>
          
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition shadow-sm">
            <Plus className="w-5 h-5 mr-2" /> New Vendor Bill
          </button>
        </div>

        {showAdd && (
          <div className="card p-6 border-emerald-100 ring-1 ring-emerald-50 shadow-md">
            <h3 className="font-semibold mb-4 text-emerald-800 border-b border-emerald-50 pb-2 flex items-center">
              <Receipt className="w-4 h-4 mr-2" /> Record Incoming Stock (Purchase)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {!activeBranchId && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Branch</label>
                  <select required value={targetBranchId} onChange={e => setTargetBranchId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white text-sm">
                    <option value="" disabled>Select Branch</option>
                    <option value="main">Main Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Select Vendor</label>
                <select value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white text-sm">
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Payment Method</label>
                  <select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white text-sm">
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                {paymentMethod === 'Online' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Account Info</label>
                    <input type="text" placeholder="e.g. Meezan, Easypaisa" value={paymentAccount} onChange={e => setPaymentAccount(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white text-sm" />
                  </div>
                )}
              </div>
            </div>
            
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1 mt-4">Add Items to Bill</label>
            <div className="flex flex-col xl:flex-row space-y-2 xl:space-y-0 xl:space-x-2 mb-4">
              <select value={currentItem} onChange={handleItemSelect} className="flex-1 rounded-md border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white text-sm">
                <option value="">Select Item to receiving stock...</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Current Stock: {i.stock})</option>)}
              </select>
              <div className="flex space-x-2">
                <input type="number" min="1" placeholder="Qty" value={currentQty} onChange={e => setCurrentQty(parseInt(e.target.value))} className="w-20 rounded-md border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white text-sm" />
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-slate-400 text-sm">Cost</span>
                  <input type="number" min="0" placeholder="Cost Rate" value={currentCostPrice} onChange={e => setCurrentCostPrice(parseFloat(e.target.value))} className="w-28 rounded-md border border-slate-300 pl-10 pr-2 py-2 bg-slate-50 focus:bg-white text-sm" />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-slate-400 text-sm">Sale</span>
                  <input type="number" min="0" placeholder="Retail Price" value={currentSalePrice} onChange={e => setCurrentSalePrice(parseFloat(e.target.value))} className="w-28 rounded-md border border-slate-300 pl-10 pr-2 py-2 bg-slate-50 focus:bg-white text-sm" />
                </div>
                <button type="button" onClick={handleAddItem} className="px-4 bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 rounded hover:bg-emerald-100 transition">Add</button>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="mb-4 bg-emerald-50 p-4 border border-emerald-100 rounded-md">
                <ul className="mb-2 space-y-2">
                  {selectedItems.map((item, idx) => (
                    <li key={idx} className="flex flex-col lg:flex-row lg:items-center justify-between text-sm font-mono text-emerald-900 border-b border-emerald-100/50 pb-3 mt-2 first:mt-0">
                      <span className="mb-2 lg:mb-0">{item.qty} x {item.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase text-emerald-700">Cost:</span>
                        <input 
                          type="number" 
                          value={item.price || 0} 
                          onChange={(e) => {
                            const newPrice = Number(e.target.value);
                            const updatedItems = [...selectedItems];
                            updatedItems[idx].price = newPrice;
                            setSelectedItems(updatedItems);
                          }}
                          className="w-20 px-2 py-1 text-right border border-emerald-200 rounded focus:border-emerald-500 focus:outline-none bg-white text-emerald-900"
                        />
                        <span className="text-[10px] uppercase text-sky-700 md:ml-2">Sale:</span>
                        <input 
                          type="number" 
                          value={item.salePrice || 0} 
                          onChange={(e) => {
                            const newSalePrice = Number(e.target.value);
                            const updatedItems = [...selectedItems];
                            updatedItems[idx].salePrice = newSalePrice;
                            setSelectedItems(updatedItems);
                          }}
                          className="w-20 px-2 py-1 text-right border border-sky-200 rounded focus:border-sky-500 focus:outline-none bg-white text-sky-900"
                        />
                        <span className="font-bold border-l border-emerald-200 pl-3 ml-2 w-28 text-right">PKR {(item.qty * item.price).toFixed(2)}</span>
                        <button type="button" onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-600 ml-2 font-bold text-lg leading-none shrink-0" title="Remove item">×</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="text-right font-bold text-lg border-t border-emerald-200 pt-2 text-emerald-900 flex justify-between">
                  <span>Grand Total</span>
                  <span>PKR {selectedItems.reduce((sum, item) => sum + (item.qty * item.price), 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button 
              onClick={handleCheckout} 
              disabled={isSubmitting}
              className="w-full bg-[#0f172a] text-white py-2.5 rounded font-medium hover:bg-slate-800 transition shadow-sm mt-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Save Vendor Bill, Edit Prices & Add Stock'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map(purchase => {
            const bName = branches.find(b => b.id === purchase.branchId)?.name || 'Unknown Branch';
            return (
              <div key={purchase.id} className="card p-5 relative flex flex-col border-emerald-100/50 hover:border-emerald-200">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">Bill Total</div>
                  <div className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                    {bName}
                  </div>
                </div>
                <div className="stat-value text-slate-800 mb-1">PKR {purchase.total.toFixed(2)}</div>
                <div className="text-sm font-medium text-emerald-700">Vendor: {purchase.vendorName || '--'}</div>
                <div className="text-xs font-mono text-slate-400 mt-1 uppercase">
                  {new Date(purchase.date || (purchase.createdAt?.seconds * 1000) || Date.now()).toLocaleString()}
                    <span className="block mt-0.5 text-slate-500">
                      <span className="font-semibold text-slate-600">PAID VIA:</span> {purchase.paymentMethod || 'Cash'} {purchase.paymentMethod === 'Online' && purchase.paymentAccount ? `(${purchase.paymentAccount})` : ''}
                    </span>
                </div>
                <div className="mt-2 pt-4 border-t border-slate-100 space-y-1 flex-1">
                  {purchase.items?.slice(0, 3).map((item, i) => (
                    <div key={i} className="text-xs flex justify-between font-mono">
                      <span className="text-slate-500">+{item.qty} {item.name}</span>
                      <span className="text-slate-400">@ {item.price} {item.salePrice ? `(S: ${item.salePrice})` : ''}</span>
                    </div>
                  ))}
                  {(purchase.items?.length || 0) > 3 && <div className="text-xs text-slate-400">+{purchase.items.length - 3} more</div>}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                  {user?.role === 'super_admin' && enableDeletion ? (
                    <button 
                      onClick={(e) => handleDeletePurchase(purchase.id, e)}
                      className="text-xs flex items-center px-2 py-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : <div></div>}
                  <button 
                    onClick={() => setPrintPurchase(purchase)}
                    className="text-xs flex items-center px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Bill
                  </button>
                </div>
              </div>
            );
          })}
          {purchases.length === 0 && <div className="col-span-full py-12 text-center text-slate-500 card border-dashed">No vendor purchases recorded yet.</div>}
        </div>
      </div>

      {printPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 print:bg-white print:static print:z-auto backdrop-blur-sm print:backdrop-blur-none">
          <div className="bg-white rounded-lg shadow-2xl w-[400px] max-w-[95vw] max-h-[95vh] flex flex-col print:w-full print:shadow-none print:rounded-none print:max-h-none h-full md:h-auto">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 print:hidden shrink-0">
               <h3 className="font-semibold text-slate-800">Print Vendor Invoice</h3>
               <button onClick={() => setPrintPurchase(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div id="print-invoice-content" className="p-8 print:thermal-receipt text-black bg-white overflow-y-auto print:overflow-visible flex-1 content-start">
               <div className="text-center mb-4 print:mb-3">
                 <h1 className="text-2xl print:text-xl font-bold font-serif uppercase tracking-widest leading-tight text-slate-900">
                   {printPurchase.branchId === 'main' ? 'Main Branch' : (branches.find(b => b.id === printPurchase.branchId)?.name || 'Branch')}
                 </h1>
                 <div className="mt-2 text-[10px] font-bold tracking-widest uppercase bg-slate-100 py-1 border border-slate-200">Purchase Bill</div>
               </div>
               
               <div className="text-xs print:text-[11px] font-mono text-slate-700 mb-4 space-y-1">
                 <div><span className="font-semibold text-slate-700">Receipt No:</span> #{printPurchase.id.substring(0,8).toUpperCase()}</div>
                 <div><span className="font-semibold text-slate-700">Date:</span> {new Date(printPurchase.date || (printPurchase.createdAt?.seconds * 1000) || Date.now()).toLocaleString()}</div>
                 <div><span className="font-semibold text-slate-700">Vendor:</span> {printPurchase.vendorName || '--'}</div>
                 <div>
                   <span className="font-semibold text-slate-700">Settlement:</span> {printPurchase.paymentMethod || 'Cash'} {printPurchase.paymentMethod === 'Online' && printPurchase.paymentAccount ? `(${printPurchase.paymentAccount})` : ''}
                 </div>
               </div>

               <div className="border-t border-b border-slate-800 py-2 mb-3">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1 border-b border-dashed border-slate-300 pb-1">
                   <span>Item</span>
                   <span>Rate / Amt</span>
                 </div>
                 <div className="space-y-1">
                   {printPurchase.items?.map((item, idx) => (
                     <div key={idx} className="flex justify-between text-[10px] font-mono">
                       <div className="flex-1 pr-2">
                         <div className="font-semibold text-slate-800 leading-tight">{item.name}</div>
                         <div className="text-slate-500">{item.qty} units (IN)</div>
                       </div>
                       <div className="text-right">
                         <div className="text-slate-500">@ {item.price.toFixed(0)}</div>
                         <div className="text-slate-800 font-bold">{(item.qty * item.price).toFixed(0)}</div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="flex justify-between items-center pt-1">
                 <span className="text-xs font-bold uppercase tracking-wider">Total PKR</span>
                 <span className="text-base font-bold font-mono">{printPurchase.total.toFixed(0)}</span>
               </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0 print:hidden rounded-b-lg">
               <button 
                 onClick={() => printInvoice('print-invoice-content', 'Vendor Purchase Bill')}
                 className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 transition-colors shadow-sm"
               >
                 <Printer className="w-4 h-4 mr-2" /> Print
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
