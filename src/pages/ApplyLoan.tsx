import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function ApplyLoan({ profile }: { profile: UserProfile | null }) {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    monthlyIncome: '',
    existingDebts: '',
    employerName: '',
    lengthOfEmployment: '',
  });

  const [idFile, setIdFile] = useState<File | null>(null);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Simulate file upload (would use Firebase Storage in production)
      const idImageUrl = idFile ? "https://images.unsplash.com/photo-1554224155-1696413565d3?q=80" : "";

      await addDoc(collection(db, 'loans'), {
        borrowerId: profile.uid,
        loanNumber: `LN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: Number(formData.amount),
        balance: Number(formData.amount), // Initial balance is the full amount
        term: '2 months',
        status: 'active', // For demo purposes, we auto-approve
        purpose: formData.purpose,
        monthlyIncome: Number(formData.monthlyIncome),
        createdAt: new Date().toISOString(),
        penaltyAmount: 0,
      });

      // Update user with ID document if uploaded
      if (idImageUrl) {
        await updateDoc(doc(db, 'users', profile.uid), { idImageUrl });
      }

      // Notify Admin
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: 'New Loan Application',
        message: `${profile.fullName} has applied for a ₱${formData.amount} loan.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      setShowSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'loans');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <header className="flex items-center gap-4 mb-8 bg-brand p-4 -mx-4 -mt-4 text-white">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">Apply for Loan</h1>
      </header>

      <div className="mb-4 flex justify-between items-end">
        <div>
           <h2 className="text-xl font-display font-bold text-brand">Apply for Loan</h2>
           <p className="text-[10px] uppercase font-black text-brand opacity-60">Step {step} out of 4</p>
        </div>
        <p className="text-[10px] font-black text-brand opacity-60">{(step / 4) * 100}% Complete</p>
      </div>

      <div className="h-2 bg-slate-200 rounded-full mb-8 overflow-hidden">
        <motion.div 
          animate={{ width: `${(step / 4) * 100}%` }}
          className="h-full bg-brand shadow-[0_0_10px_rgba(128,32,32,0.5)] transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 min-h-[400px]">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
             <h3 className="font-bold border-b pb-2 mb-4">Personal Information</h3>
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                <input value={profile?.fullName} readOnly className="w-full p-3 bg-red-50/50 rounded-lg border border-red-100 outline-none text-slate-700 italic cursor-not-allowed" />
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                <input value={profile?.phoneNumber} readOnly className="w-full p-3 bg-red-50/50 rounded-lg border border-red-100 outline-none text-slate-700 italic cursor-not-allowed" />
             </div>
             <button onClick={handleNext} className="w-full py-4 bg-green-500 text-white font-black rounded-xl shadow-lg mt-8 uppercase tracking-widest active:scale-95 transition-all">Next Step</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
             <h3 className="font-bold border-b pb-2 mb-4 text-brand">Loan Details</h3>
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Loan Amount (₱)</label>
                <input value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} type="number" className="w-full p-3 bg-red-50/30 rounded-lg border border-red-100 outline-none text-brand focus:ring-2 focus:ring-brand shadow-inner" />
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Purpose of loan</label>
                <textarea value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} className="w-full p-3 bg-red-50/30 rounded-lg border border-red-100 outline-none text-brand focus:ring-2 focus:ring-brand min-h-[100px] shadow-inner" />
             </div>
             <div className="grid grid-cols-2 gap-4 mt-8">
                <button onClick={handlePrev} className="py-4 bg-slate-400 text-white font-black rounded-xl shadow-lg uppercase tracking-widest">Previous</button>
                <button onClick={handleNext} className="py-4 bg-green-500 text-white font-black rounded-xl shadow-lg uppercase tracking-widest">Next Step</button>
             </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
             <h3 className="font-bold border-b pb-2 mb-4 text-brand">Financial Information</h3>
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Monthly Income (₱)</label>
                <input value={formData.monthlyIncome} onChange={(e) => setFormData({...formData, monthlyIncome: e.target.value})} type="number" className="w-full p-3 bg-red-50/30 rounded-lg border border-red-100 outline-none" />
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Employer Name</label>
                <input value={formData.employerName} onChange={(e) => setFormData({...formData, employerName: e.target.value})} className="w-full p-3 bg-red-50/30 rounded-lg border border-red-100 outline-none" />
             </div>
             <div className="grid grid-cols-2 gap-4 mt-8">
                <button onClick={handlePrev} className="py-4 bg-slate-400 text-white font-black rounded-xl shadow-lg uppercase tracking-widest">Previous</button>
                <button onClick={handleNext} className="py-4 bg-green-500 text-white font-black rounded-xl shadow-lg uppercase tracking-widest">Next Step</button>
             </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
             <h3 className="font-bold border-b pb-2 mb-4 text-brand">Upload Documents</h3>
             
             <div className="space-y-6">
                <div className="p-4 border-2 border-dashed border-red-100 rounded-2xl flex flex-col items-center gap-3 relative group overflow-hidden">
                   <Upload className="w-8 h-8 text-brand/30 group-hover:text-brand/50 transition-colors" />
                   <div className="text-center">
                     <p className="text-xs font-bold text-slate-700">Valid ID</p>
                     <p className="text-[8px] text-slate-400">Driver's License, Passport, or Government ID</p>
                   </div>
                   <input type="file" onChange={(e) => setIdFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   <button className="bg-red-500 text-[10px] font-black text-white px-4 py-1.5 rounded-md uppercase tracking-widest mt-2">{idFile ? 'File Selected' : 'Choose File'}</button>
                   {idFile && <p className="text-[10px] text-green-600 font-bold">{idFile.name}</p>}
                </div>

                <div className="p-4 border-2 border-dashed border-red-100 rounded-2xl bg-slate-50 opacity-50 flex flex-col items-center gap-3">
                   <Upload className="w-8 h-8 text-brand/30" />
                   <div className="text-center">
                     <p className="text-xs font-bold text-slate-700">Proof of Income</p>
                     <p className="text-[8px] text-slate-400">Payslip or Certificate of Employment</p>
                   </div>
                   <button disabled className="bg-slate-400 text-[10px] font-black text-white px-4 py-1.5 rounded-md uppercase tracking-widest mt-2">Optional</button>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-12">
                <button onClick={handlePrev} className="py-4 bg-slate-400 text-white font-black rounded-xl shadow-lg uppercase tracking-widest">Previous</button>
                <button 
                   onClick={handleSubmit} 
                   disabled={loading}
                   className="py-4 bg-green-500 text-white font-black rounded-xl shadow-lg uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Now'}
                </button>
             </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-2 border-green-500">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">Congratulations!</h3>
                <p className="text-slate-600 font-bold text-xs mb-4">Your loan Application is Submitted Successfully.</p>
                <p className="text-slate-400 text-[10px] mb-8 leading-relaxed italic">
                  You'll receive an email confirmation shortly with your application reference number. Our team will review your application within 5-7 business days and keep you updated via email at every stage.
                </p>
                <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-green-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg">Done</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
