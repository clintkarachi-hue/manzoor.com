import { Outlet, Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { useSettings } from '../context/SettingsContext';
import { InstallPWA } from './InstallPWA';
import { 
  BuildingIcon, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Users, 
  Building2, 
  UsersRound, 
  LogOut,
  ChevronDown,
  BookText,
  BarChart3,
  Bell,
  KeyRound,
  Banknote,
  Menu,
  ShieldAlert,
  X
} from 'lucide-react';
import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../lib/firebase';

export function Layout() {
  const { user, firebaseUser, logout } = useAuth();
  const { branches, activeBranchId, setActiveBranchId } = useBranch();
  const { enableDeletion, toggleDeletion } = useSettings();
  const location = useLocation();
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    // To feed the notification bell
    if (user?.role !== 'super_admin' && !activeBranchId) {
      return; // wait for context to set it
    }

    let inventoryQuery = collection(db, 'inventory');
    if (activeBranchId) {
      inventoryQuery = query(inventoryQuery, where('branchId', '==', activeBranchId)) as any;
    }

    const unsubInventory = onSnapshot(inventoryQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const lowStock = items.filter(i => i.stock <= (i.minStockLevel || 10));
      setLowStockCount(lowStock.length);
      
      if (lowStock.length > 0 && user?.role === 'branch_admin') {
        console.log(`[SYSTEM MOCK] Sent Critical Low Stock Email to Branch Admin (${user?.email}) for ${lowStock.length} items.`);
      }
    });

    return () => unsubInventory();
  }, [activeBranchId, user?.role, user?.email]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !firebaseUser.email) return;
    setIsChangingPwd(true);
    setPwdError('');
    setPwdSuccess('');

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      
      // Update password
      await updatePassword(firebaseUser, newPassword);
      setPwdSuccess("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password");
    } finally {
      setIsChangingPwd(false);
    }
  };

  const fullNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['super_admin', 'branch_admin', 'staff'] },
    { name: 'Inventory', href: '/inventory', icon: Package, roles: ['super_admin', 'branch_admin', 'staff'] },
    { name: 'Sales / Billing', href: '/sales', icon: ShoppingCart, roles: ['super_admin', 'branch_admin', 'staff', 'billing_only'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['super_admin', 'branch_admin'] },
    { name: 'Purchases', href: '/purchases', icon: Truck, roles: ['super_admin', 'branch_admin', 'staff'] },
    { name: 'Ledger / Cashbook', href: '/ledger', icon: BookText, roles: ['super_admin', 'branch_admin'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['super_admin', 'branch_admin', 'staff', 'billing_only'] },
    { name: 'Vendors', href: '/vendors', icon: Building2, roles: ['super_admin', 'branch_admin', 'staff'] },
    { name: 'Labour', href: '/employees', icon: UsersRound, roles: ['super_admin', 'branch_admin'] },
    { name: 'Payroll', href: '/payroll', icon: Banknote, roles: ['super_admin', 'branch_admin'] },
    { name: 'Users & Logins', href: '/users', icon: KeyRound, roles: ['super_admin', 'branch_admin'] },
  ];

  const navigation = fullNavigation.filter(item => user && item.roles.includes(user.role));

  if (user?.role === 'super_admin') {
    navigation.push({ name: 'Manage Branches', href: '/branches', icon: BuildingIcon, roles: ['super_admin'] });
    navigation.push({ name: 'Settings', href: '/settings', icon: ShieldAlert, roles: ['super_admin'] });
  }

  const activeBranch = activeBranchId === 'main' 
    ? { id: 'main', name: 'Main Branch (HQ)', color: '#10b981', adminEmail: '' }
    : branches.find(b => b.id === activeBranchId);

  return (
    <div className="flex bg-slate-100 flex-1 overflow-hidden h-screen w-full print:h-auto print:overflow-visible print:block relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "bg-[#0f172a] h-full flex flex-col print:hidden z-40 shrink-0 absolute md:relative transition-transform duration-300 w-60",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-white font-bold text-lg tracking-tight leading-tight">
            MANZOOR<br/>
            <span className="text-sky-400 font-normal">COLLECTION</span>
          </h1>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="mt-4 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    isActive ? 'bg-[#1e293b] text-sky-400 border-l-4 border-sky-400' : 'text-slate-400 hover:text-white',
                    'flex items-center px-5 py-3 text-sm transition-colors'
                  )}
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-300 w-32 truncate">{user?.name}</span>
              <span className="text-xs text-slate-500 capitalize">{user?.role.replace('_', ' ')}</span>
            </div>
            <button 
              onClick={logout}
              className="text-slate-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">Powered by Aamir Engineering</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible relative print:block">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between z-10 shrink-0 print:hidden relative">
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 -ml-1 text-slate-500 hover:text-slate-700 md:hidden shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            {user?.role === 'super_admin' ? (
              <div className="flex items-center gap-3 md:gap-6">
                <div className="hidden sm:flex items-center gap-2 bg-[#d1fae5] text-[#065f46] px-3 py-1 rounded-full text-xs font-semibold">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeBranch?.color || (activeBranchId === null ? '#64748b' : '#10b981') }}></div>
                  <span>{activeBranch?.name || (activeBranchId === null ? 'All Branches Combined' : 'Loading Branch...')}</span>
                </div>
                <div className="hidden sm:block h-4 w-[1px] bg-slate-300"></div>

                <div className="relative">
                  <button 
                    onClick={() => setShowBranchMenu(!showBranchMenu)}
                    className="bg-slate-50 border border-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 flex items-center justify-between min-w-[120px] sm:min-w-[200px]"
                  >
                    <span className="truncate">{activeBranch ? activeBranch.name : 'All Branches'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500 ml-2 shrink-0" />
                  </button>

                  {showBranchMenu && (
                    <div className="absolute left-0 mt-1 w-full rounded shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 text-xs text-slate-700">
                      <div className="py-1" role="menu">
                        <button
                          onClick={() => { setActiveBranchId(null); setShowBranchMenu(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center text-slate-500 font-medium"
                        >
                          View: All Branches Combined
                        </button>
                        <button
                          onClick={() => { setActiveBranchId('main'); setShowBranchMenu(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center font-medium"
                        >
                          <span className="w-2 h-2 rounded-full mr-2 bg-emerald-500"></span>
                          Main Branch (HQ)
                        </button>
                        {branches.map(branch => (
                          <button
                            key={branch.id}
                            onClick={() => { setActiveBranchId(branch.id); setShowBranchMenu(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center"
                          >
                            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: branch.color }}></span>
                            {branch.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#d1fae5] text-[#065f46] px-3 py-1 rounded-full text-xs font-semibold">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeBranch?.color || '#10b981' }}></div>
                <span>{activeBranch?.name || 'Loading Branch...'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
            
            {/* NOTIFICATION BELL */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-700 transition"
              >
                <Bell className="w-5 h-5" />
                {lowStockCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-ping"></span>
                )}
                {lowStockCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-xl ring-1 ring-slate-900/5 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="font-semibold text-slate-800">Notifications</span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{lowStockCount} New</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {lowStockCount > 0 ? (
                      <Link 
                        to="/inventory" 
                        onClick={() => setShowNotifications(false)}
                        className="block p-4 hover:bg-slate-50 transition border-b border-slate-50"
                      >
                        <div className="flex items-start">
                          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-1">
                            <BookText className="w-4 h-4 text-rose-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-slate-800">Low Stock Alert</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                              {lowStockCount} items have fallen below their minimum stock threshold. Check inventory to restock.
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">Email sent to Admin.</p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="p-6 text-center text-sm text-slate-500">
                        No new notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            
            <InstallPWA className="!py-1.5 !px-3 !text-xs !bg-emerald-600 hover:!bg-emerald-700 hidden sm:flex" />

            <span className="hidden sm:inline-block">{user?.role === 'super_admin' ? 'Super Admin' : user?.name}</span>
            <div className="relative">
              <div 
                className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs shrink-0 cursor-pointer"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {user?.name?.substring(0,2).toUpperCase()}
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl ring-1 ring-slate-900/5 z-50 overflow-hidden">
                  <div className="py-1" role="menu">
                    <button
                      onClick={() => { setShowProfileMenu(false); setShowChangePassword(true); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center"
                    >
                      <KeyRound className="w-4 h-4 mr-2 text-slate-400" />
                      Change Password
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); logout(); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto bg-slate-100 flex flex-col print:overflow-visible print:bg-white print:block">
          <div className="p-8 space-y-6 flex-1 print:p-0 print:block">
            <Outlet />
          </div>
          
          <footer className="py-4 mt-auto text-center text-xs text-slate-500 bg-white border-t border-slate-200 shrink-0 print:border-none print:bg-transparent print:pt-8 print:text-[10px]">
            <p>&copy; 2026&ndash;2080 {activeBranchId === 'main' ? 'Main Branch' : (branches.find(b => b.id === activeBranchId)?.name || 'Our Company')}&trade;. All Rights Reserved.</p>
            <p className="mt-0.5">Powered &amp; Developed by Aamir Engineering.</p>
          </footer>
        </div>

      </main>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Change Password</h2>
            
            {pwdError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border-l-4 border-red-500">{pwdError}</div>}
            {pwdSuccess && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded border-l-4 border-emerald-500">{pwdSuccess}</div>}
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 bg-white"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowChangePassword(false)}
                  className="px-4 py-2 rounded text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  disabled={isChangingPwd}
                  className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700 font-medium disabled:opacity-50"
                >
                  {isChangingPwd ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
