import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Loan, PaymentMethod, PaymentStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle2, QrCode, CreditCard, Landmark, Banknote, X, AlertCircle } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function MakePayment({ profile }: { profile: UserProfile | null }) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refNo, setRefNo] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    const q = query(collection(db, 'loans'), where('borrowerId', '==', profile.uid), where('status', '==', 'active'), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) setLoan({ id: snap.docs[0].id, ...snap.docs[0].data() } as Loan);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'loans');
    });

    const pq = query(collection(db, 'payments'), where('borrowerId', '==', profile.uid));
    const unsubP = onSnapshot(pq, (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });

    return () => {
      unsub();
      unsubP();
    };
  }, [profile]);

  const handleSubmitPayment = async () => {
    if (!profile || !loan || !selectedMethod) return;
    setLoading(true);
    try {
      const payload: any = {
        loanId: loan.id,
        borrowerId: profile.uid,
        method: selectedMethod,
        status: PaymentStatus.PENDING,
        paymentDate: new Date().toISOString(),
        isPenaltyPayment: paymentNote.toLowerCase().includes('penalty'),
        notes: paymentNote,
      };

      if (selectedMethod === PaymentMethod.CASH_COLLECTION) {
        payload.notes = `Collection Request for ${collectionDate}. ${paymentNote}`;
      } else {
        payload.amount = 5000; // Fixed amount for now as per screenshot demo
        payload.referenceNo = refNo;
      }

      await addDoc(collection(db, 'payments'), payload);

      // Notify Admin
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: `Payment ${selectedMethod}`,
        message: `${profile.fullName} has submitted a payment via ${selectedMethod}.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      setShowConfirm(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'payments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <header className="flex items-center gap-4 mb-8 bg-brand p-4 -mx-4 -mt-4 text-white">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">Make Payment</h1>
      </header>

      {/* Payment Summary */}
      <div className="bg-brand rounded-2xl p-6 shadow-xl text-white mb-6 border border-white/10 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-lg font-display font-bold">Payment History</h3>
           <button onClick={() => setSelectedMethod(null)} className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">
              + Make Payment
           </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
           <div className="bg-white/10 p-2 rounded-lg text-center backdrop-blur-sm">
             <p className="text-[8px] uppercase font-bold opacity-60">Total Paid</p>
             <p className="text-xs font-black text-green-400 leading-none">₱{(loan ? loan.amount - loan.balance : 0).toLocaleString()}</p>
           </div>
           <div className="bg-white/10 p-2 rounded-lg text-center backdrop-blur-sm">
             <p className="text-[8px] uppercase font-bold opacity-60">Next Payment</p>
             <p className="text-xs font-black text-yellow-400 leading-none truncate">Feb 30, 2026</p>
           </div>
           <div className="bg-white/10 p-2 rounded-lg text-center backdrop-blur-sm">
             <p className="text-[8px] uppercase font-bold opacity-60">Amount Due</p>
             <p className="text-xs font-black leading-none">₱5,000</p>
           </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 mb-6">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <h3 className="font-display font-black text-brand text-xs uppercase tracking-widest">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-50 text-slate-400 font-black border-b border-slate-100 uppercase">
                 <tr>
                    <th className="px-4 py-3">Loan ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {payments.map((p, i) => (
                   <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-400">{loan?.loanNumber || '---'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-bold text-green-600">₱{p.amount?.toLocaleString() || '---'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.method}</td>
                      <td className="px-4 py-3">
                         <span className={cn(
                           "px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white",
                           p.status === 'completed' ? "bg-green-500" : "bg-yellow-400"
                         )}>
                            {p.status}
                         </span>
                      </td>
                   </tr>
                 ))}
                 {payments.length === 0 && (
                   <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No payments yet.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* Method Selection Modal/Sheet */}
      <AnimatePresence>
        {!selectedMethod && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
           >
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
                 <button className="absolute right-4 top-4 focus:outline-none"><X className="w-5 h-5 text-slate-400" /></button>
                 <h2 className="text-brand font-display font-bold text-lg mb-6 pt-2">Choose Payment Method</h2>
                 
                 <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex flex-col items-center mb-6">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Amount to Pay</p>
                    <p className="text-3xl font-display font-black text-brand tracking-tighter">₱5,000</p>
                    <p className="text-[10px] font-mono text-slate-400">{loan?.loanNumber}</p>
                 </div>

                 <div className="space-y-3">
                    {[
                      { id: PaymentMethod.GCASH, label: 'GCash', sub: 'Pay via Gcash mobile wallet', icon: CreditCard, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                      { id: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', sub: 'Direct bank deposit or online transfer', icon: Landmark, color: 'text-green-600 bg-green-50 border-green-100' },
                      { id: PaymentMethod.CASH_COLLECTION, label: 'Cash Collection', sub: 'Our Collector will visit you to collect', icon: Banknote, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
                    ].map(item => (
                      <button 
                         key={item.id} 
                         onClick={() => setSelectedMethod(item.id)}
                         className="w-full flex items-center gap-4 p-4 border rounded-2xl hover:bg-slate-50 transition-all text-left"
                      >
                         <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border", item.color)}>
                            <item.icon className="w-6 h-6" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800">{item.label}</p>
                            <p className="text-[10px] text-slate-400 truncate leading-tight">{item.sub}</p>
                         </div>
                      </button>
                    ))}
                 </div>
              </motion.div>
           </motion.div>
        )}

        {selectedMethod && !showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl w-full max-w-sm p-0 shadow-2xl relative overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                   <h2 className="text-brand font-display font-bold text-lg leading-none">Payment Details</h2>
                   <button onClick={() => setSelectedMethod(null)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                   <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex flex-col items-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Amount to Pay</p>
                      <p className="text-2xl font-display font-black text-brand tracking-tighter leading-none">₱5,000</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{loan?.loanNumber}</p>
                   </div>

                   {selectedMethod === PaymentMethod.GCASH && (
                     <div className="space-y-4">
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 relative group">
                           <div className="flex justify-between items-start mb-4">
                              <p className="text-xs font-bold text-blue-800">Send payment to:</p>
                              <span className="text-[10px] font-black uppercase text-blue-600 bg-white px-2 py-0.5 rounded">GCash</span>
                           </div>
                           <div className="flex flex-col items-center gap-4">
                              <div className="p-2 bg-white rounded-xl shadow-inner border border-blue-100">
                                 <QRCodeSVG value="09307158807" size={120} />
                              </div>
                              <div className="text-center">
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">GCash Number:</p>
                                 <p className="text-lg font-black text-slate-800 font-mono tracking-tighter">09307158807</p>
                                 <p className="text-[10px] font-medium text-slate-500 uppercase">Velveth Lending Co.</p>
                              </div>
                           </div>
                           <button className="absolute right-4 bottom-4 p-3 bg-white text-blue-600 border border-blue-100 rounded-xl shadow-md active:scale-90 transition-all">
                              <Copy className="w-5 h-5" />
                           </button>
                        </div>
                        <input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="GCash Reference Number *" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-semibold tracking-wide" />
                        <p className="text-[9px] text-slate-400 text-center leading-relaxed">Enter the 13-digit reference number found in your GCash transaction receipt.</p>
                     </div>
                   )}

                   {selectedMethod === PaymentMethod.BANK_TRANSFER && (
                     <div className="space-y-4">
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 space-y-4">
                           <div className="flex items-center gap-3">
                              <Landmark className="w-6 h-6 text-green-600" />
                              <p className="text-[10px] font-black uppercase text-green-700 tracking-widest">Bank Account Details</p>
                           </div>
                           <div className="space-y-3">
                              <div className="bg-white p-3 rounded-lg border border-green-100 flex justify-between items-center group">
                                 <div>
                                    <p className="text-[8px] uppercase font-bold text-slate-400">Bank Name</p>
                                    <p className="text-xs font-bold text-slate-800">BDO Unibank</p>
                                 </div>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-green-100 flex justify-between items-center group">
                                 <div>
                                    <p className="text-[8px] uppercase font-bold text-slate-400">Account Name</p>
                                    <p className="text-xs font-bold text-slate-800 uppercase">Velveth Lending Company</p>
                                 </div>
                                 <Copy className="w-4 h-4 text-slate-300 cursor-pointer" />
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-green-100 flex justify-between items-center group">
                                 <div>
                                    <p className="text-[8px] uppercase font-bold text-slate-400">Account Number</p>
                                    <p className="text-xs font-black text-slate-800 tracking-widest">1234-5678-9011</p>
                                 </div>
                                 <Copy className="w-4 h-4 text-slate-300 cursor-pointer" />
                              </div>
                           </div>
                        </div>
                        <input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="Bank Reference Number *" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-semibold tracking-wide" />
                     </div>
                   )}

                   {selectedMethod === PaymentMethod.CASH_COLLECTION && (
                     <div className="space-y-4">
                        <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 space-y-3">
                           <div className="flex gap-3">
                              <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0" />
                              <p className="text-xs font-bold text-yellow-800 leading-tight">Cash Collection Information</p>
                           </div>
                           <ul className="text-[10px] text-slate-600 space-y-2 list-disc pl-4 font-medium italic">
                              <li>Our authorized collector will visit your registered address.</li>
                              <li>Please prepare the exact amount.</li>
                              <li>Collection hours: 9:00 AM - 5:00 PM (Mon-Sat).</li>
                           </ul>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1 block">Preferred Collection Date*</label>
                           <input type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold" />
                           <p className="text-[9px] text-slate-400 mt-2 px-1">Select a date for our collector to visit your registered location.</p>
                        </div>
                     </div>
                   )}

                   {/* Add note section as requested */}
                   <div className="pt-2">
                      <label className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1 block">Payment Note / Description</label>
                      <textarea 
                        value={paymentNote} 
                        onChange={(e) => setPaymentNote(e.target.value)} 
                        placeholder="e.g. this is a penalty payment" 
                        className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm italic shadow-inner"
                      />
                   </div>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4 border-t bg-slate-50">
                   <button onClick={() => setSelectedMethod(null)} className="py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-xl shadow-sm uppercase tracking-widest">Back</button>
                   <button 
                     onClick={handleSubmitPayment} 
                     disabled={loading}
                     className="py-4 bg-brand text-white font-black rounded-xl shadow-lg uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                   >
                     {loading ? 'Sending...' : 'Submit Payment'}
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}

        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl w-full max-w-sm p-0 shadow-2xl relative overflow-hidden border-2 border-green-500">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                   <p className="text-xs font-bold text-slate-800">Confirm Payment</p>
                   <button onClick={() => setShowConfirm(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                
                <div className="p-6 space-y-6">
                   <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex flex-col items-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Amount to Pay</p>
                      <p className="text-2xl font-display font-black text-brand tracking-tighter leading-none">₱5,000</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{loan?.loanNumber}</p>
                   </div>

                   <div className="bg-green-50 rounded-2xl p-6 border border-green-100 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-800 mb-2 leading-none uppercase tracking-tighter">Payment Submitted!</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">Your payment is being verified. You will receive a Email notification once confirmed.</p>
                   </div>

                   <div className="bg-slate-50 rounded-xl p-4 space-y-3 font-mono text-[10px] uppercase font-black text-slate-500 border border-slate-100">
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span>Payment Method:</span>
                        <span className="text-slate-800 tracking-tight">{selectedMethod}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span>Amount:</span>
                        <span className="text-slate-800 tracking-tight">₱5,000</span>
                      </div>
                      {refNo && (
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span>Reference No.</span>
                          <span className="text-slate-800 tracking-tighter">{refNo}</span>
                        </div>
                      )}
                      {collectionDate && (
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                           <span>Collection Date:</span>
                           <span className="text-slate-800 tracking-tight">{new Date(collectionDate).toLocaleDateString()}</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="p-6 pt-0">
                   <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-green-500 text-white font-black rounded-xl text-lg uppercase tracking-widest shadow-xl shadow-green-500/20 active:translate-y-1 transition-transform">Done</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
