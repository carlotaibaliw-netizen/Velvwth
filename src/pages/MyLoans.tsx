import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Loan } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, History } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function MyLoans({ profile }: { profile: UserProfile | null }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'loans'),
      where('borrowerId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setLoans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'loans');
    });

    return () => unsub();
  }, [profile]);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <header className="flex items-center gap-4 mb-8 bg-brand p-4 -mx-4 -mt-4 text-white">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">My Loans</h1>
      </header>

      <div className="flex justify-between items-center mb-6 px-1">
         <h2 className="text-xl font-display font-bold text-brand">Loan History</h2>
         <History className="w-5 h-5 text-brand opacity-60" />
      </div>

      <div className="space-y-6">
        {loans.map((loan) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={loan.id} 
            className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden group"
          >
             <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                   <h3 className="font-display font-black text-brand text-sm leading-none uppercase tracking-tighter mb-1">Loan #{loan.loanNumber}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Started on {new Date(loan.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none text-white shadow-sm",
                  loan.status === 'active' ? "bg-green-500" : "bg-slate-400"
                )}>
                   {loan.status}
                </span>
             </div>

             <div className="p-6">
                <div className="grid grid-cols-3 gap-3 mb-6 font-display font-black text-center uppercase tracking-tighter">
                   <div className="bg-green-500 rounded-xl p-3 text-white shadow-lg shadow-green-500/20">
                      <p className="text-[8px] opacity-70 mb-1">Loan Amount</p>
                      <p className="text-xs leading-none">₱{loan.amount.toLocaleString()}</p>
                   </div>
                   <div className="bg-blue-400 rounded-xl p-3 text-white shadow-lg shadow-blue-400/20">
                      <p className="text-[8px] opacity-70 mb-1">Remaining Amount</p>
                      <p className="text-xs leading-none">₱{loan.balance.toLocaleString()}</p>
                   </div>
                   <div className="bg-brand rounded-xl p-3 text-white shadow-lg shadow-brand/20">
                      <p className="text-[8px] opacity-70 mb-1 leading-tight">Due Date February 30, 2026</p>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span className="uppercase tracking-widest text-[10px] text-slate-400 font-black">Loan Progress</span>
                      <span className="italic">{loan.status === 'completed' ? '100' : Math.round(((loan.amount - loan.balance) / loan.amount) * 100)}%</span>
                   </div>
                   <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                      <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${loan.status === 'completed' ? 100 : ((loan.amount - loan.balance) / loan.amount) * 100}%` }}
                         className={cn("h-full shadow-lg transition-all", loan.status === 'completed' ? "bg-slate-400" : "bg-green-500")}
                      />
                   </div>
                </div>
             </div>
          </motion.div>
        ))}

        {loans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 opacity-20 animate-pulse">
             <History className="w-20 h-20 mb-4" />
             <p className="font-display font-black uppercase text-xs tracking-[0.2em] italic">No Loan History Found</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
