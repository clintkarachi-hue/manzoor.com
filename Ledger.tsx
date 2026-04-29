import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router';

export function Dashboard() {
  const { user } = useAuth();
  const { activeBranchId } = useBranch();

  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<{id: string, name: string, stock: number, minStockLevel: number}[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [allInventory, setAllInventory] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    // If user is super admin and activeBranchId is null, we fetch all.
    // If activeBranchId is set, we filter by branch.
    if (user?.role !== 'super_admin' && !activeBranchId) return;
    
    // We'll set up snapshots for sales, purchases, and inventory
    
    let salesQuery: any = collection(db, 'sales');
    let purchaseQuery: any = collection(db, 'purchases');
    let inventoryQuery: any = collection(db, 'inventory');
    
    if (activeBranchId) {
      salesQuery = query(salesQuery, where('branchId', '==', activeBranchId));
      purchaseQuery = query(purchaseQuery, where('branchId', '==', activeBranchId));
      inventoryQuery = query(inventoryQuery, where('branchId', '==', activeBranchId));
    }

    const unsubSales = onSnapshot(salesQuery, (snap) => {
      const salesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllSales(salesList);
      
      const sortedSales = [...salesList].sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return dateB - dateA;
      }).slice(0, 5);
      setRecentSales(sortedSales);
    });

    const unsubPurchases = onSnapshot(purchaseQuery, (snap) => {
      const total = snap.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);
      setTotalPurchases(total);
    });

    const unsubInventory = onSnapshot(inventoryQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setAllInventory(items);
      const total = items.reduce((acc, doc) => acc + (doc.stock || 0), 0);
      const totalValue = items.reduce((acc, doc) => acc + ((doc.stock || 0) * (doc.cost || 0)), 0);
      setTotalItems(total);
      setTotalInventoryValue(totalValue);
      
      const lowStock = items.filter(i => i.stock <= (i.minStockLevel || 10));
      setLowStockItems(lowStock);

      setLoading(false); // Just approximation for loading state
    });

    return () => {
      unsubSales();
      unsubPurchases();
      unsubInventory();
    };
  }, [activeBranchId]);

  const computedTotalSales = allSales.reduce((acc, sale) => acc + (sale.total || 0), 0);
  const computedTotalCostOfSales = allSales.reduce((acc, sale) => {
    const items = sale.items || [];
    const costOfThisSale = items.reduce((itemAcc: number, item: any) => {
      let cost = item.cost;
      if (typeof cost === 'undefined') {
        const invItem = allInventory.find(inv => inv.id === item.id || inv.name === item.name);
        cost = invItem?.cost || 0;
      }
      return itemAcc + ((item.qty || 0) * cost);
    }, 0);
    return acc + (sale.transactionType === 'Return' ? -costOfThisSale : costOfThisSale);
  }, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySalesList = allSales.filter(s => {
    const d = new Date(s.date || (s.createdAt?.seconds * 1000) || Date.now());
    return d >= todayStart;
  });

  const todayTotalSales = todaySalesList.reduce((acc, sale) => acc + (sale.total || 0), 0);
  const todayTotalCostOfSales = todaySalesList.reduce((acc, sale) => {
    const items = sale.items || [];
    const costOfThisSale = items.reduce((itemAcc: number, item: any) => {
      let cost = item.cost;
      if (typeof cost === 'undefined') {
        const invItem = allInventory.find(inv => inv.id === item.id || inv.name === item.name);
        cost = invItem?.cost || 0;
      }
      return itemAcc + ((item.qty || 0) * cost);
    }, 0);
    return acc + (sale.transactionType === 'Return' ? -costOfThisSale : costOfThisSale);
  }, 0);

  const stats = [
    { name: 'Today\'s Profit', value: `PKR ${(todayTotalSales - todayTotalCostOfSales).toLocaleString()}`, trend: `From PKR ${todayTotalSales.toLocaleString()} sales today`, trendColor: 'text-indigo-600' },
    { name: 'Total Sales (All Time)', value: `PKR ${computedTotalSales.toLocaleString()}`, trend: 'Gross Revenue', trendColor: 'text-sky-600' },
    { name: 'Net Profit (All Time)', value: `PKR ${(computedTotalSales - computedTotalCostOfSales).toLocaleString()}`, trend: 'Based on COGS', trendColor: 'text-emerald-600' },
    { name: 'Stock Inventory Value', value: `PKR ${totalInventoryValue.toLocaleString()}`, trend: `${totalItems.toLocaleString()} items in stock ${lowStockItems.length > 0 ? `(${lowStockItems.length} low)` : ''}`, trendColor: lowStockItems.length > 0 ? 'text-rose-500' : 'text-slate-500' },
  ];

  return (
    <>
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start shadow-sm mb-6 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 mr-3 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-rose-800">Critical Stock Threshold Reached</h3>
            <p className="text-xs text-rose-600 mt-1">
              {lowStockItems.length} items are currently below their minimum stock level. 
              <span className="font-semibold ml-1 text-rose-800">Please review inventory immediately to avoid stockouts.</span>
            </p>
          </div>
          <Link to="/inventory" className="shrink-0 ml-4 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 transition">
            Review Stock
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            className="card p-5 cursor-pointer hover:shadow-md transition-shadow border border-transparent hover:border-sky-200"
            onClick={() => setActiveModal(stat.name)}
          >
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{stat.name}</div>
              <div className="stat-value text-slate-800">{stat.value}</div>
            </div>
            <div className={`mt-2 text-[11px] font-medium ${stat.trendColor}`}>
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="card flex flex-col overflow-hidden lg:col-span-2">
          <div className="grid-header flex justify-between items-center bg-slate-50 border-b border-slate-200 p-4">
            <span className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Real-time Sales Activity</span>
            <Link to="/sales" className="text-[10px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50">View All</Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <div className="min-w-full">
              <div className="grid-row bg-slate-50 font-bold text-[11px] border-b border-slate-200 text-slate-500 px-4">
                <div className="uppercase tracking-tighter w-24">TXN ID</div>
                <div className="uppercase tracking-tighter flex-1">Customer</div>
                <div className="uppercase tracking-tighter w-32 text-right">Date</div>
                <div className="uppercase tracking-tighter text-right w-32">Amount</div>
                <div className="uppercase tracking-tighter text-center w-24">Status</div>
              </div>
              
              {recentSales.length > 0 ? recentSales.map((sale) => (
                <div key={sale.id} className="grid-row px-4 text-slate-700 hover:bg-slate-50">
                  <div className="font-mono text-xs w-24">{sale.invoiceNumber || sale.id.slice(-6).toUpperCase()}</div>
                  <div className="font-medium flex-1 text-sm">{sale.customerName || 'Walk-in Customer'}</div>
                  <div className="w-32 text-right text-xs text-slate-500">
                    {sale.createdAt?.toDate ? sale.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </div>
                  <div className="text-right font-bold w-32 text-slate-900">PKR {Number(sale.total || 0).toLocaleString()}</div>
                  <div className="text-center w-24">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                      sale.paymentStatus === 'paid' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : sale.paymentStatus === 'partial'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {(sale.paymentStatus || 'paid').toUpperCase()}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                  <ShoppingCart className="w-8 h-8 mb-2 opacity-20" />
                  <span className="text-sm font-medium">No recent sales</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Compact View */}
        <div className="card flex flex-col overflow-hidden">
          <div className="grid-header flex justify-between items-center bg-slate-50 border-b border-slate-200 p-4">
            <span className="text-sm font-semibold text-rose-800 uppercase tracking-wider flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" /> Low Stock Items
            </span>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            {lowStockItems.length > 0 ? (
              <div className="divide-y divide-slate-100">
                 {lowStockItems.slice(0, 8).map(item => (
                   <div key={item.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                     <span className="text-sm font-medium text-slate-700 truncate pr-2">{item.name}</span>
                     <span className="text-xs font-mono font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                       {item.stock} left
                     </span>
                   </div>
                 ))}
                 {lowStockItems.length > 8 && (
                   <div className="p-3 text-center">
                     <Link to="/inventory" className="text-xs text-sky-600 font-medium hover:underline">View all {lowStockItems.length} alerts</Link>
                   </div>
                 )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-slate-400 h-full">
                <Package className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-sm font-medium">All stock levels normal</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeModal && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 z-40" onClick={() => setActiveModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto">
              <div className="flex justify-between items-center p-4 border-b border-slate-100">
                <h3 className="font-semibold text-lg text-slate-800">{activeModal} - Daily Breakdown</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:bg-slate-100 rounded-full p-1 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="px-4 py-2 border-b border-slate-200">Date</th>
                      {activeModal.includes('Profit') || activeModal.includes('Sales') ? (
                        <>
                          <th className="px-4 py-2 border-b border-slate-200 text-right">Sales Count</th>
                          <th className="px-4 py-2 border-b border-slate-200 text-right">Revenue</th>
                          <th className="px-4 py-2 border-b border-slate-200 text-right">Cost</th>
                          <th className="px-4 py-2 border-b border-slate-200 text-right">Profit</th>
                        </>
                      ) : activeModal.includes('Stock') ? (
                        <>
                          <th className="px-4 py-2 border-b border-slate-200">Item</th>
                          <th className="px-4 py-2 border-b border-slate-200 text-right">Stock</th>
                          <th className="px-4 py-2 border-b border-slate-200 text-right">Value (PKR)</th>
                        </>
                      ) : (
                        <th className="px-4 py-2 border-b border-slate-200">Details</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeModal.includes('Profit') || activeModal.includes('Sales')) && (() => {
                      const dailyMap = new Map<string, { sales: number, cost: number, count: number }>();
                      allSales.forEach(sale => {
                        const d = new Date(sale.date || (sale.createdAt?.seconds * 1000) || Date.now());
                        const dateKey = d.toLocaleDateString();
                        if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, { sales: 0, cost: 0, count: 0 });
                        const existing = dailyMap.get(dateKey)!;
                        existing.sales += (sale.total || 0);
                        existing.count += (sale.transactionType === 'Return' ? 0 : 1);
                        let costOfSale = 0;
                        (sale.items || []).forEach((item: any) => {
                          let cost = item.cost;
                          if (typeof cost === 'undefined') {
                            const invItem = allInventory.find(inv => inv.id === item.id || inv.name === item.name);
                            cost = invItem?.cost || 0;
                          }
                          costOfSale += ((item.qty || 0) * cost);
                        });
                        existing.cost += (sale.transactionType === 'Return' ? -costOfSale : costOfSale);
                      });
                      const rows = Array.from(dailyMap.entries()).sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
                      if (rows.length === 0) return <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No data available</td></tr>;
                      return rows.map(([date, data]) => (
                        <tr key={date} className="hover:bg-slate-50 transition-colors text-slate-700">
                          <td className="px-4 py-3 font-medium text-slate-800">{date}</td>
                          <td className="px-4 py-3 text-right">{data.count}</td>
                          <td className="px-4 py-3 text-right text-sky-600 font-mono">{(data.sales).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-rose-500 font-mono">{(data.cost).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-bold font-mono">{(data.sales - data.cost).toLocaleString()}</td>
                        </tr>
                      ));
                    })()}
                    
                    {activeModal.includes('Stock') && (() => {
                      const sortedInc = [...allInventory].sort((a,b) => ((b.stock || 0)*(b.cost || 0)) - ((a.stock || 0)*(a.cost || 0)));
                      if (sortedInc.length === 0) return <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No items available</td></tr>;
                      return sortedInc.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors text-slate-700">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.name} <span className="text-[10px] text-slate-400 block">{item.sku}</span></td>
                          <td className="px-4 py-3 text-right">{item.stock}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-800">{((item.stock || 0)*(item.cost || 0)).toLocaleString()}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
