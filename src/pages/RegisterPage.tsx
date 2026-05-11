import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Role } from '../types';
import { CheckCircle2, X } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function RegisterPage() {
  const [showTerms, setShowTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    loanIdNumber: '', // As requested instead of email in some UI contexts, but we still need email for login
    email: '', 
    phoneNumber: '',
    address: '',
    dobMonth: '',
    dobDate: '',
    dobYear: '',
    gender: '',
    civilStatus: '',
    idCardType: '',
    nativeLanguage: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please agree to terms and conditions');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 9) {
      setError('Password must have at least 9 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In a real app, if loanIdNumber is used instead of email, 
      // we'd probably use a dummy email or ask for it anyway.
      // I'll assume email is provided for auth.
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          fullName: formData.fullName,
          loanIdNumber: formData.loanIdNumber,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          dateOfBirth: `${formData.dobMonth} ${formData.dobDate}, ${formData.dobYear}`,
          gender: formData.gender,
          civilStatus: formData.civilStatus,
          idCardType: formData.idCardType,
          nativeLanguage: formData.nativeLanguage,
          role: Role.USER,
          createdAt: new Date().toISOString(),
        });
        setShowSuccess(true);
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.CREATE, `users/${user.uid}`);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-display font-bold text-center text-brand mb-6 uppercase">VLC Mobile Registration</h1>
        
        <form onSubmit={handleRegister} className="bg-brand rounded-2xl p-6 shadow-2xl text-white space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Full Name</label>
            <input 
              name="fullName"
              placeholder="Full Name"
              onChange={handleChange}
              className="w-full p-2 rounded bg-white text-slate-800 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block font-bold">Loan ID number (Email Address alternative)</label>
            <input 
              name="loanIdNumber"
              placeholder="Loan ID Number"
              onChange={handleChange}
              className="w-full p-2 rounded bg-white text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Email Address (Used for Login)</label>
            <input 
              name="email"
              type="email"
              placeholder="Email Address"
              onChange={handleChange}
              className="w-full p-2 rounded bg-white text-slate-800 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Phone Number</label>
            <input 
              name="phoneNumber"
              placeholder="Phone Number"
              onChange={handleChange}
              className="w-full p-2 rounded bg-white text-slate-800 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Address</label>
            <input 
              name="address"
              placeholder="Address"
              onChange={handleChange}
              className="w-full p-2 rounded bg-white text-slate-800 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold mb-1 block">Date of Birth</label>
              <select name="dobMonth" onChange={handleChange} className="w-full p-1 h-9 rounded bg-white text-slate-800 outline-none">
                <option value="">Month</option>
                <option value="Jan">Jan</option>
                <option value="Feb">Feb</option>
                <option value="Mar">Mar</option>
                {/* Add others as needed */}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <select name="dobDate" onChange={handleChange} className="w-full p-1 h-9 rounded bg-white text-slate-800 outline-none">
                <option value="">Date</option>
                {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <select name="dobYear" onChange={handleChange} className="w-full p-1 h-9 rounded bg-white text-slate-800 outline-none">
                <option value="">Year</option>
                {Array.from({length: 60}, (_, i) => 2010 - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Gender</label>
              <select name="gender" onChange={handleChange} className="w-full p-2 rounded bg-white text-slate-800 outline-none">
                <option value="">Select Option</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Civil Status</label>
              <select name="civilStatus" onChange={handleChange} className="w-full p-2 rounded bg-white text-slate-800 outline-none">
                <option value="">Select Option</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">ID Card</label>
              <select name="idCardType" onChange={handleChange} className="w-full p-2 rounded bg-white text-slate-800 outline-none">
                <option value="">Select Option</option>
                <option value="UMID">UMID</option>
                <option value="SSS">SSS</option>
                <option value="Driver License">Driver's License</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Native Language</label>
              <select name="nativeLanguage" onChange={handleChange} className="w-full p-2 rounded bg-white text-slate-800 outline-none">
                 <option value="">Select Option</option>
                <option value="Tagalog">Tagalog</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>

          <p className="text-[10px] italic opacity-80 pt-1">Note: You will need to take picture of selected ID card later in application process.</p>

          <div>
            <label className="text-xs font-medium mb-1 block">Create Password</label>
            <input 
              name="password"
              type="password"
              onChange={handleChange}
              className="w-full p-2 rounded bg-white text-slate-800 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Confirm Password</label>
            <input 
              name="confirmPassword"
              type="password"
              onChange={handleChange}
              className="w-full p-2 rounded bg-white text-slate-800 outline-none"
              required
            />
          </div>

          <p className="text-[10px] opacity-80 italic">Password must have at least 9 characters.</p>

          <button 
            type="button" 
            onClick={() => setShowTerms(true)}
            className="flex items-center text-xs font-medium hover:underline"
          >
             <input type="checkbox" checked={agreed} readOnly className="mr-2 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
             Read & Agree to Terms
          </button>

          {error && <p className="text-red-300 text-[10px] text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-vibrant text-white font-bold rounded-lg shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-[10px]">
            Already have an account? <Link to="/login" className="text-green-300 font-bold hover:underline">Login here</Link>
          </p>
        </form>
      </div>

      {/* Terms Overlay */}
      <AnimatePresence>
        {showTerms && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-brand-light rounded-2xl w-full max-w-sm flex flex-col p-6 shadow-2xl max-h-[80vh]"
            >
               <h2 className="text-brand font-display font-bold text-xl text-center mb-4">Terms & Condition</h2>
               <div className="flex-1 overflow-y-auto pr-2 mb-6 text-[10px] text-slate-600 space-y-4">
                  <h3 className="text-center font-bold text-brand uppercase text-xs">General Agreements</h3>
                  <p>By using these services, you agree to be bound by the Terms and Conditions that will be made available to you concerning these services. VLC does not guarantee the continuous availability of all Mobile Banking services mentioned in this agreement...</p>
                  <p>Loss or damage arising out of any fraudulent access or utilization of the Mobile Banking services due to theft or unauthorized disclosure of mobile phones, credentials, or violation of other security measures used for Mobile Banking with or without your participation.</p>
                  <p>*Any and all liability, costs, damages, losses and causes of action arising from or in any way connected with the disclosure of information concerning your accounts and/or transactions with the Bank to unauthorized persons for any reason whatsoever including but not limited to wiretapping of communication lines or erroneous connection by telecommunication switches...</p>
                  <h3 className="text-center font-bold text-brand uppercase text-xs">Data Privacy Act (DPA)</h3>
                  <p>This Privacy Policy describes our policies and procedures on the collection, use and disclosure of your information when You use the service and tells You about your privacy rights and how the law protects You.</p>
               </div>
               
               <div className="flex items-center mb-6">
                 <input 
                    type="checkbox" 
                    id="terms-check" 
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mr-3 h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand"
                 />
                 <label htmlFor="terms-check" className="text-[10px] font-bold text-brand italic">
                    I have read and agreed to Terms and Conditions and Privacy Policy
                 </label>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setShowTerms(false)} className="py-2 bg-brand text-white font-bold rounded-lg uppercase text-sm">Agree</button>
                  <button onClick={() => { setAgreed(false); setShowTerms(false); }} className="py-2 bg-brand text-white font-bold rounded-lg uppercase text-sm">Disagree</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6"
          >
            <motion.div 
               initial={{ scale: 0.9 }}
               animate={{ scale: 1 }}
               className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-2 border-green-500"
            >
               <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-10 h-10 text-white" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">You Successfully Register!</h3>
               <p className="text-slate-600 text-xs mb-8 leading-relaxed">
                 Congratulations you are successfully registered to Velveth Lending App. You may now login to your account.
               </p>
               <button 
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-lg text-lg hover:bg-green-600 transition-colors shadow-lg"
               >
                 Okay
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
