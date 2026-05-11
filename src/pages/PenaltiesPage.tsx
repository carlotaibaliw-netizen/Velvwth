import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Penalty } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Info, Clock } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function PenaltiesPage({ profile }: { profile: UserProfile | null }) {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'penalties'),
      where('borrowerId', '==', profile.uid),
      where('status', '==', 'unpaid')
    );

    const unsub = onSnapshot(q, (snap) => {
      setPenalties(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Penalty)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'penalties');
    });

    return () => unsub();
  }, [profile]);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <header className="flex items-center gap-4 mb-8 bg-brand p-4 -mx-4 -mt-4 text-white">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">Penalties</h1>
      </header>

      <div className="mb-6">
        <h2 className="text-xl font-display font-bold text-brand">Outstanding Penalties</h2>
        <p className="text-xs text-brand font-medium italic opacity-70">
          {penalties.length > 0 
            ? `You have ${penalties.length} outstanding penalties. Please settle as soon as possible.`
            : 'You have no outstanding penalties. Keep up the good work!'}
        </p>
      </div>

      <div className="space-y-6 mb-10">
        {penalties.map((penalty) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={penalty.id} 
            className="bg-white rounded-2xl p-6 shadow-xl border border-brand/10 relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-bl-[100px] -z-10 group-hover:bg-brand/10 transition-colors" />
             
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="font-display font-black text-brand text-sm uppercase tracking-tighter">Penalty #Pen-001</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(penalty.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <p className="text-2xl font-display font-black text-brand-vibrant tracking-tighter">₱{penalty.amount.toLocaleString()}</p>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <p className="text-[8px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Related Loan</p>
                   <p className="text-xs font-black text-slate-800">LN-2025-001</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-center items-end">
                   <p className="text-[8px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Status</p>
                   <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest leading-none">Unpaid</span>
                </div>
             </div>

             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none">Reason</p>
                <p className="text-xs font-bold text-slate-800 italic leading-relaxed">“ {penalty.reason} ”</p>
             </div>
          </motion.div>
        ))}

        {penalties.length === 0 && (
          <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 opacity-60">
             <AlertTriangle className="w-12 h-12 mb-4" />
             <p className="font-display font-black uppercase text-xs tracking-widest">Great! No Penalties Found</p>
          </div>
        )}
      </div>

      {/* Policy Card */}
      <div className="bg-brand rounded-2xl p-6 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
             <Info className="w-6 h-6" />
           </div>
           <h3 className="font-display font-black uppercase tracking-widest">Penalty Policy</h3>
        </div>
        <ul className="space-y-4">
           {[
             'Late payment fee: ₱50 per day for the first 5 days',
             'After 5 days: Additional 5% of the weekly payment amount',
             'Penalties must be settled before the next payment',
             'Contact support if you need assistance with payments'
           ].map((policy, i) => (
             <li key={i} className="flex gap-4 items-start group">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                <p className="text-xs font-medium opacity-90 leading-relaxed font-sans">{policy}</p>
             </li>
           ))}
        </ul>
      </div>

      <BottomNav />
    </div>
  );
}
