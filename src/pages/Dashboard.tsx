import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile, Loan, Payment } from '../types';
import { CreditCard, History, FormInput, UserCog, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Dashboard({ profile }: { profile: UserProfile | null }) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    // Fetch active loan
    const loanQuery = query(
      collection(db, 'loans'), 
      where('borrowerId', '==', profile.uid),
      where('status', '==', 'active'),
      limit(1)
    );

    const unsubLoan = onSnapshot(loanQuery, (snapshot) => {
      if (!snapshot.empty) {
        setLoan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Loan);
      } else {
        setLoan(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'loans');
    });

    // Fetch activities (recent payments or status changes)
    const q = query(
      collection(db, 'payments'),
      where('borrowerId', '==', profile.uid),
      limit(5)
    );

    const unsubActivities = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, type: 'payment', ...doc.data() }));
      setActivities(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });

    return () => {
      unsubLoan();
      unsubActivities();
    };
  }, [profile]);

  const menuItems = [
    { label: 'Make Payment', icon: CreditCard, path: '/make-payment' },
    { label: 'My loan', icon: History, path: '/my-loans' },
    { label: 'Apply loan', icon: FormInput, path: '/apply-loan' },
    { label: 'Manage Account', icon: UserCog, path: '/manage-account' },
  ];

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <header className="flex justify-between items-center mb-6 bg-brand p-4 -mx-4 -mt-4 text-white">
        <h1 className="text-lg font-display font-bold">Welcome, {profile?.fullName.split(' ')[0]}!</h1>
        <button onClick={() => navigate('/manage-account')} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* Grid Menu */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {menuItems.map((item) => (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center p-4 bg-brand text-white rounded-xl shadow-lg hover:brightness-110 transition-all border border-white/10"
          >
            <item.icon className="w-10 h-10 mb-2" />
            <span className="text-xs font-bold text-center leading-tight">{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Loan Status Card */}
      <div className="bg-brand rounded-2xl p-6 shadow-xl text-white mb-6 border border-white/10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-sm font-medium opacity-80 mb-1">Outstanding Balance</h3>
            <p className="text-3xl font-display font-bold">₱{loan?.balance?.toLocaleString() || '0'}</p>
          </div>
          <span className="bg-green-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Active</span>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-medium">Payment Progress</span>
            <span className="opacity-80">
                {loan ? Math.round(((loan.amount - loan.balance) / loan.amount) * 100) : 0}% Paid
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: loan ? `${((loan.amount - loan.balance) / loan.amount) * 100}%` : '0%' }}
               className="h-full bg-green-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
           <div>
              <p className="text-[10px] opacity-70 uppercase font-black mb-1">Next Payment</p>
              <p className="text-xs font-bold">February 30, 2026</p>
           </div>
           <button 
             onClick={() => navigate('/make-payment')}
             className="bg-green-500 hover:bg-green-600 transition-colors px-4 py-2 rounded-lg text-xs font-black shadow-lg"
           >
             Pay ₱5,000
           </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-6">
         <div className="bg-green-500 p-3 rounded-lg text-center text-white shadow-lg">
            <p className="text-[8px] uppercase font-bold opacity-80 mb-1">Total Paid</p>
            <p className="text-xs font-extrabold leading-none">₱{(loan ? loan.amount - loan.balance : 0).toLocaleString()}</p>
         </div>
         <div className="bg-blue-400 p-3 rounded-lg text-center text-white shadow-lg">
            <p className="text-[8px] uppercase font-bold opacity-80 mb-1">Loan Amount</p>
            <p className="text-xs font-extrabold leading-none">₱{loan?.amount?.toLocaleString() || '0'}</p>
         </div>
         <div className="bg-yellow-400 p-3 rounded-lg text-center text-white shadow-lg">
            <p className="text-[8px] uppercase font-bold opacity-80 mb-1">Payments Made</p>
            <p className="text-xs font-extrabold leading-none">10 of 15</p>
         </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-brand rounded-xl overflow-hidden shadow-xl border border-white/10">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-display font-bold">Recent Activities</h3>
        </div>
        <div className="flex flex-col">
          {activities.length > 0 ? activities.map((activity, i) => (
            <div key={activity.id} className={cn("p-4 flex justify-between items-center text-white", i !== activities.length - 1 && "border-b border-white/5 bg-white/5")}>
               <div>
                  <p className="text-xs font-medium">Payment received</p>
                  <p className="text-[10px] opacity-60">February 21, 2026</p>
               </div>
               <p className="text-sm font-bold text-green-400 leading-none">₱{activity.amount?.toLocaleString()}</p>
            </div>
          )) : (
            <div className="p-8 text-center text-white/50 text-xs italic">No recent activities</div>
          )}
          <div className="p-4 flex justify-between items-center text-white border-b border-white/5 bg-white/5">
             <div>
                <p className="text-xs font-medium">Payment reminder sent</p>
                <p className="text-[10px] opacity-60">February 14, 2026</p>
             </div>
          </div>
          <div className="p-4 flex justify-between items-center text-white">
             <div>
                <p className="text-xs font-medium">Loan approved</p>
                <p className="text-[10px] opacity-60">December 20, 2025</p>
             </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
