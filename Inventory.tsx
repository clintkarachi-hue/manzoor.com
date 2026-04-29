import React, { useState, useEffect } from 'react';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart3, Printer } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfWeek, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { printInvoice } from '../lib/print';

interface Sale {
  id: string;
  branchId: string;
  customerName?: string;
  customerId?: string;
  total: number;
  items: Array<{ id: string, name: string, qty: number, price: number }>;
  createdAt: any;
  date?: number;
}

interface Purchase {
  id: string;
  branchId: string;
  vendorName?: string;
  vendorId?: string;
  total: number;
  items: Array<{ id: string, name: string, qty: number, price: number }>;
  createdAt: any;
  date?: number;
}

export function Reports() {
  const { user } = useAuth();
  const { activeBranchId, branches } = useBranch();
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [aggregation, setAggregation] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [reportType, setReportType] = useState<'sales' | 'items' | 'customers' | 'vendors' | 'profitability'>('sales');

  useEffect(() => {
    if (user?.role !== 'super_admin' && !activeBranchId) return;

    let qSales: any = collection(db, 'sales');
    let qPurchases: any = collection(db, 'purchases');
    let qInventory: any = collection(db, 'inventory');
    
    if (activeBranchId) {
      qSales = query(qSales, where('branchId', '==', activeBranchId));
      qPurchases = query(qPurchases, where('branchId', '==', activeBranchId));
      qInventory = query(qInventory, where('branchId', '==', activeBranchId));
    }

    const unsubSales = onSnapshot(qSales, (snap) => setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale))));
    const unsubPurchases = onSnapshot(qPurchases, (snap) => setPurchases(snap.docs.map(d => ({ id: d.id, ...d.data() } as Purchase))));
    const unsubInventory = onSnapshot(qInventory, (snap) => setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    
    return () => {
      unsubSales();
      unsubPurchases();
      unsubInventory();
    };
  }, [user, activeBranchId]);

  const reportData = () => {
    const start = startOfDay(parseISO(startDate || format(new Date(), 'yyyy-MM-dd')));
    const end = endOfDay(parseISO(endDate || format(new Date(), 'yyyy-MM-dd')));

    const filteredSales = sales.filter(s => {
      const d = new Date(s.date || (s.createdAt?.seconds * 1000) || Date.now());
      return isWithinInterval(d, { start, end });
    });

    const filteredPurchases = purchases.filter(p => {
      const d = new Date(p.date || (p.createdAt?.seconds * 1000) || Date.now());
      return isWithinInterval(d, { start, end });
    });

    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

    const trendMap = new Map<string, { display: string, total: number }>();
    const itemsMap = new Map<string, { revenue: number, qty: number }>();
    const profitMap = new Map<string, { revenue: number, cost: number, profit: number, qty: number }>();
    const branchMap = new Map<string, number>();
    const customerMap = new Map<string, { name: string, total: number, count: number }>();
    const vendorMap = new Map<string, { name: string, total: number, count: number }>();

    filteredSales.forEach(sale => {
      const d = new Date(sale.date || (sale.createdAt?.seconds * 1000) || Date.now());
      let sortKey = '', display = '';
      if (aggregation === 'daily') {
        sortKey = format(d, 'yyyy-MM-dd'); display = format(d, 'MMM dd');
      } else if (aggregation === 'weekly') {
        const sw = startOfWeek(d);
        sortKey = format(sw, 'yyyy-MM-dd'); display = `Wk ${format(sw, 'MMM dd')}`;
      } else if (aggregation === 'monthly') {
        sortKey = format(d, 'yyyy-MM'); display = format(d, 'MMM yyyy');
      } else {
        sortKey = format(d, 'yyyy'); display = format(d, 'yyyy');
      }

      const existing = trendMap.get(sortKey) || { display, total: 0 };
      trendMap.set(sortKey, { display, total: existing.total + sale.total });

      (sale.items || []).forEach(item => {
        const i = itemsMap.get(item.name) || { revenue: 0, qty: 0 };
        itemsMap.set(item.name, { revenue: i.revenue + (item.qty * item.price), qty: i.qty + item.qty });

        const p = profitMap.get(item.name) || { revenue: 0, cost: 0, profit: 0, qty: 0 };
        const invItem = inventory.find(inv => inv.id === item.id || inv.name === item.name);
        // Using average cost or current cost from inventory. If none, cost is 0.
        const unitCost = Number(invItem?.cost || 0);
        const revenue = item.qty * Number(item.price || 0);
        const cost = item.qty * unitCost;
        profitMap.set(item.name, {
          revenue: p.revenue + revenue,
          cost: p.cost + cost,
          profit: p.profit + (revenue - cost),
          qty: p.qty + item.qty
        });
      });

      if (!activeBranchId) {
        const bName = branches.find(b => b.id === sale.branchId)?.name || 'Unknown';
        branchMap.set(bName, (branchMap.get(bName) || 0) + sale.total);
      }

      const customerName = sale.customerName || 'Walk-in Customer';
      const c = customerMap.get(customerName) || { name: customerName, total: 0, count: 0 };
      customerMap.set(customerName, { name: customerName, total: c.total + sale.total, count: c.count + 1 });
    });

    filteredPurchases.forEach(purchase => {
      const vendorName = purchase.vendorName || 'Unknown Vendor';
      const v = vendorMap.get(vendorName) || { name: vendorName, total: 0, count: 0 };
      vendorMap.set(vendorName, { name: vendorName, total: v.total + purchase.total, count: v.count + 1 });
    });

    const trendChart = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, val]) => ({ period: val.display, sales: val.total }));

    const allItems = Array.from(itemsMap.entries())
      .map(([name, data]) => ({ name, revenue: data.revenue, qty: data.qty }))
      .sort((a,b) => b.revenue - a.revenue);
    
    const topItems = allItems.slice(0, 5);

    const branchChart = activeBranchId ? [] : Array.from(branchMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a,b) => b.revenue - a.revenue);

    const customerReport = Array.from(customerMap.values()).sort((a, b) => b.total - a.total);
    const vendorReport = Array.from(vendorMap.values()).sort((a, b) => b.total - a.total);

    const profitabilityReport = Array.from(profitMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.profit - a.profit);

    return { 
      filteredCount: filteredSales.length, 
      totalRevenue, 
      trendChart, 
      topItems, 
      allItems,
      branchChart,
      customerReport,
      vendorReport,
      profitabilityReport
    };
  };

  const reports = reportData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center card p-4 print:hidden">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center">
          <BarChart3 className="w-6 h-6 mr-3 text-sky-600" />
          Analytics & Reports
        </h2>
        <button onClick={() => printInvoice('report-print-content', 'Sales Report', 'a4')} className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition shadow-sm">
          <Printer className="w-5 h-5 mr-2" /> Print
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-4 items-end bg-slate-50 border-slate-200 print:hidden">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Group By</label>
          <select value={aggregation} onChange={(e: any) => setAggregation(e.target.value)} className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div className="flex border-b border-slate-200 print:hidden overflow-x-auto">
        {(['sales', 'items', 'customers', 'vendors', 'profitability'] as const).map(type => (
          <button 
            key={type}
            onClick={() => setReportType(type)}
            className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              reportType === type ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {type === 'sales' && 'Sales Overview'}
            {type === 'items' && 'Best Selling Items'}
            {type === 'customers' && 'Customer Report'}
            {type === 'vendors' && 'Vendor Report'}
            {type === 'profitability' && 'Profitability by Item'}
          </button>
        ))}
      </div>

      <div id="report-print-content" className="space-y-6 print:space-y-4 print:bg-white print:p-8 print:w-full print:absolute print:left-0 print:top-0 print:z-50 print:h-full">
        <div className="hidden print:block text-center border-b border-slate-200 pb-4 mb-4">
          <h1 className="text-2xl font-bold font-serif uppercase tracking-widest text-slate-900">
             {activeBranchId === 'main' ? 'Main Branch' : (branches.find(b => b.id === activeBranchId)?.name || 'Branch')}
          </h1>
          <h2 className="text-lg font-bold text-slate-700 mt-1 uppercase tracking-widest">
            {reportType === 'sales' && 'Sales Report'}
            {reportType === 'items' && 'Best Selling Items Report'}
            {reportType === 'customers' && 'Customer Sales Report'}
            {reportType === 'vendors' && 'Vendor Purchases Report'}
            {reportType === 'profitability' && 'Profitability Report'}
            {' '}({startDate} to {endDate})
          </h2>
          <p className="text-xs text-slate-400 mt-2">Printed on {new Date().toLocaleString()}</p>
        </div>

        {reportType === 'sales' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="card p-5">
                 <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Period Revenue</div>
                 <div className="stat-value text-emerald-600">PKR {reports.totalRevenue.toLocaleString()}</div>
              </div>
              <div className="card p-5">
                 <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Transactions</div>
                 <div className="stat-value text-slate-800">{reports.filteredCount}</div>
              </div>
              <div className="card p-5">
                 <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Avg Transaction</div>
                 <div className="stat-value text-sky-600">PKR {reports.filteredCount ? Math.round(reports.totalRevenue / reports.filteredCount).toLocaleString() : 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
              <div className="card p-5 flex flex-col min-h-[350px]">
                <div className="font-serif italic text-sm text-slate-600 mb-6 border-b border-slate-100 pb-2">Revenue Trend</div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reports.trendChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `PKR ${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                        itemStyle={{ color: '#38bdf8' }}
                      />
                      <Line type="monotone" dataKey="sales" stroke="#0284c7" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-5 flex flex-col min-h-[350px]">
                <div className="font-serif italic text-sm text-slate-600 mb-6 border-b border-slate-100 pb-2">Top Selling Items (Revenue)</div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports.topItems} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `PKR ${v/1000}k`} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {!activeBranchId && reports.branchChart.length > 0 && (
                <div className="card p-5 flex flex-col min-h-[350px] col-span-1 lg:col-span-2">
                  <div className="font-serif italic text-sm text-slate-600 mb-6 border-b border-slate-100 pb-2">Branch Performance Snapshot</div>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reports.branchChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `PKR ${v/1000}k`} />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {reportType === 'items' && (
          <div className="card">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Best Selling Items Detailed Report</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Rank</th>
                    <th className="px-6 py-3 font-medium">Item Name</th>
                    <th className="px-6 py-3 font-medium text-right">Quantity Sold</th>
                    <th className="px-6 py-3 font-medium text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.allItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">#{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-600 font-mono">{item.qty.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-emerald-600 font-mono">PKR {item.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                  {reports.allItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No items sold in the selected period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'customers' && (
          <div className="card">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Customer Sales Report</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Customer Name</th>
                    <th className="px-6 py-3 font-medium text-right"># of Sales Orders</th>
                    <th className="px-6 py-3 font-medium text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.customerReport.map((customer, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{customer.name}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-600 font-mono">{customer.count.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-emerald-600 font-mono">PKR {customer.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  {reports.customerReport.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">No sales recorded for any customers.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'vendors' && (
          <div className="card">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Vendor Purchases Report</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Vendor Name</th>
                    <th className="px-6 py-3 font-medium text-right"># of Purchase Orders</th>
                    <th className="px-6 py-3 font-medium text-right">Total Purchase Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.vendorReport.map((vendor, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{vendor.name}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-600 font-mono">{vendor.count.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-rose-600 font-mono">PKR {vendor.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  {reports.vendorReport.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">No purchases recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {reportType === 'profitability' && (
          <div className="card">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Profitability by Item</h3>
              <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                Total Profit: PKR {reports.profitabilityReport.reduce((acc, curr) => acc + curr.profit, 0).toLocaleString()}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Item Name</th>
                    <th className="px-6 py-3 font-medium text-right">Qty Sold</th>
                    <th className="px-6 py-3 font-medium text-right">Revenue (PKR)</th>
                    <th className="px-6 py-3 font-medium text-right">Cost (PKR)</th>
                    <th className="px-6 py-3 font-medium text-right text-emerald-600">Profit (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.profitabilityReport.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-600 font-mono">{item.qty.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-sky-600 font-mono">{item.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-rose-600 font-mono">{item.cost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-emerald-600 font-mono">{item.profit.toLocaleString()}</td>
                    </tr>
                  ))}
                  {reports.profitabilityReport.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No items sold.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
