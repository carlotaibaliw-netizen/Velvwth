import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, where, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Loan, Payment, Role, PaymentStatus } from '../types';
import { Users, FileText, CreditCard, AlertCircle, Bell, Search, Eye, User, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'loans' | 'payments' | 'penalties'>('users');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Real-time users listener
    const unsubUsers = onSnapshot(query(collection(db, 'users'), where('role', '==', Role.USER)), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Real-time loans listener
    const unsubLoans = onSnapshot(query(collection(db, 'loans'), orderBy('createdAt', 'desc')), (snapshot) => {
      setActiveLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'loans');
    });

    // Real-time payments listener (specifically pending)
    const unsubPayments = onSnapshot(query(collection(db, 'payments'), where('status', '==', PaymentStatus.PENDING)), (snapshot) => {
      setPendingPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });

    return () => {
      unsubUsers();
      unsubLoans();
      unsubPayments();
    };
  }, []);

  const handleVerifyPayment = async (paymentId: string, loanId: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'payments', paymentId), { status: PaymentStatus.COMPLETED });
      
      // Update loan balance
      // In a real app, use fieldPath values or transaction/increment
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `payments/${paymentId}`);
    }
  };

  const filteredUsers = users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()) || u.loanIdNumber?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-screen bg-slate-100 lg:flex-row">
      {/* Sidebar - Persistent on desktop */}
      <aside className="w-full lg:w-64 bg-brand text-white p-6 shadow-2xl z-20">
        <div className="flex items-center gap-3 mb-10 overflow-hidden">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
             <div className="text-brand font-black text-xl">V</div>
          </div>
          <h1 className="text-xl font-display font-bold whitespace-nowrap">Admin Portal</h1>
        </div>

        <nav className="space-y-1">
          {[
            { id: 'users', label: 'Customers', icon: Users },
            { id: 'loans', label: 'Loans', icon: FileText },
            { id: 'payments', label: 'Verify Payments', icon: CreditCard, count: pendingPayments.length },
            { id: 'penalties', label: 'Penalties', icon: AlertCircle },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg transition-all text-sm font-medium",
                activeTab === item.id ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
              {item.count ? <span className="bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full">{item.count}</span> : null}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-10 border-t border-white/10 flex items-center gap-3 opacity-60">
           <Bell className="w-5 h-5" />
           <span className="text-xs">System Live</span>
           <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <header className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-display font-bold text-brand capitalize">{activeTab} Management</h2>
           <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or ID..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-brand outline-none transition-all shadow-sm"
              />
           </div>
        </header>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <motion.div 
                layoutId={user.uid}
                key={user.uid}
                className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow relative overflow-hidden group"
              >
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{user.fullName}</h3>
                    <p className="text-xs text-slate-500 mb-1">ID: {user.loanIdNumber || 'N/A'}</p>
                    <p className="text-[10px] text-brand font-medium">{user.phoneNumber}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(user)}
                    className="p-2 hover:bg-slate-50 rounded-full transition-colors text-brand"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between gap-2">
                   <button className="flex-1 py-2 bg-brand/5 text-brand rounded-lg text-[10px] font-bold hover:bg-brand/10 transition-colors">VIEW STATUS</button>
                   <button className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors capitalize">ADD LOAN</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Reference</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {pendingPayments.map(p => {
                      const user = users.find(u => u.uid === p.borrowerId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-800">{user?.fullName || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {user?.loanIdNumber}</p>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded font-bold uppercase">{p.method}</span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-sm font-black text-slate-900 leading-none">₱{p.amount?.toLocaleString() || '---'}</span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-xs font-mono text-slate-500">{p.referenceNo || 'CASH REQUEST'}</span>
                           </td>
                           <td className="px-6 py-4 flex gap-2 justify-center">
                              <button onClick={() => handleVerifyPayment(p.id, p.loanId, p.amount)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 shadow-md">Approve</button>
                              <button className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 uppercase">Reject</button>
                           </td>
                        </tr>
                      )
                   })}
                   {pendingPayments.length === 0 && (
                     <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic text-sm">No pending payments to verify.</td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>
        )}
      </main>

      {/* User Details Modal (Simple version) */}
      <AnimatePresence>
        {selectedUser && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
           >
              <motion.div 
                layoutId={selectedUser.uid}
                className="bg-white rounded-3xl w-full max-w-lg p-0 shadow-2xl overflow-hidden relative"
              >
                 <button onClick={() => setSelectedUser(null)} className="absolute right-4 top-4 p-2 hover:bg-slate-100 rounded-full z-20">
                    <X className="w-5 h-5 text-slate-400" />
                 </button>

                 <div className="bg-brand p-8 text-white">
                    <div className="flex gap-6 items-center">
                       <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/10 shrink-0">
                          <User className="w-10 h-10" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-display font-bold leading-tight">{selectedUser.fullName}</h3>
                          <p className="opacity-70 font-mono text-sm tracking-tight">Loan ID: {selectedUser.loanIdNumber}</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                       <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Phone Number</p>
                          <p className="text-sm font-semibold text-slate-800">{selectedUser.phoneNumber}</p>
                       </div>
                       <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Address</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">{selectedUser.address}</p>
                       </div>
                       <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Civil Status</p>
                          <p className="text-sm font-semibold text-slate-800">{selectedUser.civilStatus}</p>
                       </div>
                       <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Birth Date</p>
                          <p className="text-sm font-semibold text-slate-800">{selectedUser.dateOfBirth}</p>
                       </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                       <h4 className="text-xs font-bold text-brand uppercase tracking-widest mb-4">Verification Documents</h4>
                       <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 overflow-hidden">
                          {selectedUser.idImageUrl ? (
                            <img src={selectedUser.idImageUrl} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <FileText className="w-8 h-8 opacity-20" />
                              <p className="text-[10px] font-medium font-mono uppercase tracking-widest leading-none">NO DOCUMENT UPLOADED</p>
                            </>
                          )}
                       </div>
                    </div>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
