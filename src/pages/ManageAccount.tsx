import { useNavigate } from 'react-router-dom';
import {ArrowLeft, User, Phone, Mail, MapPin, Shield, Bell, LogOut, ChevronRight, Save} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { useState } from 'react';

export default function ManageAccount({ profile }: { profile: UserProfile | null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <header className="flex items-center gap-4 mb-8 bg-brand p-4 -mx-4 -mt-4 text-white">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">Manage Account</h1>
      </header>

      {/* User Header Card */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col items-center mb-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-full" />
         <div className="w-24 h-24 bg-brand-light rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-xl">
            <User className="w-12 h-12 text-brand" />
         </div>
         <h2 className="text-2xl font-display font-black text-slate-800 leading-tight uppercase tracking-tighter">{profile?.fullName}</h2>
         <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">{profile?.role}</p>
      </div>

      <div className="space-y-4 mb-10">
         <section className="bg-white rounded-2xl p-6 shadow-md border border-slate-50">
            <div className="flex items-center gap-3 mb-6">
               <User className="w-5 h-5 text-brand" />
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Personal Information</h3>
            </div>
            
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">First Name</label>
                    <input defaultValue={profile?.fullName.split(' ')[0]} className="w-full p-3 bg-red-50/30 rounded-xl border border-red-100 outline-none text-sm font-bold text-slate-700 shadow-inner" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Last Name</label>
                    <input defaultValue={profile?.fullName.split(' ').slice(1).join(' ')} className="w-full p-3 bg-red-50/30 rounded-xl border border-red-100 outline-none text-sm font-bold text-slate-700 shadow-inner" />
                  </div>
               </div>

               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Email Address</label>
                 <input defaultValue={profile?.email} className="w-full p-3 bg-red-50/30 rounded-xl border border-red-100 outline-none text-sm font-bold text-slate-700 shadow-inner" />
               </div>

               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Phone Number</label>
                 <input defaultValue={profile?.phoneNumber} className="w-full p-3 bg-red-50/30 rounded-xl border border-red-100 outline-none text-sm font-bold text-slate-700 shadow-inner" />
               </div>

               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Address</label>
                 <input defaultValue={profile?.address} className="w-full p-3 bg-red-50/30 rounded-xl border border-red-100 outline-none text-sm font-bold text-slate-700 shadow-inner truncate" />
               </div>

               <button className="w-full py-4 bg-brand text-white font-black rounded-xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest active:translate-y-1 transition-all">
                  <Save className="w-5 h-5" />
                  Save Changes
               </button>
            </div>
         </section>

         <section className="bg-white rounded-2xl p-6 shadow-md border border-slate-50">
            <div className="flex items-center gap-3 mb-6">
               <Shield className="w-5 h-5 text-brand" />
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Security Settings</h3>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
               <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">Password</p>
                  <p className="text-[10px] text-slate-400 font-medium italic">Change your account password</p>
               </div>
               <button className="px-4 py-2 bg-brand text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">Change</button>
            </div>
         </section>

         <section className="bg-white rounded-2xl p-6 shadow-md border border-slate-50">
            <div className="flex items-center gap-3 mb-6">
               <Bell className="w-5 h-5 text-brand" />
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Notification Preferences</h3>
            </div>
            
            <div className="space-y-3">
               {[
                 { label: 'Email Notifications', sub: 'Receive updates via email' },
                 { label: 'SMS Notifications', sub: 'Receive updates via SMS' },
               ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                     <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">{item.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium italic">{item.sub}</p>
                     </div>
                     <div className="w-10 h-6 bg-brand rounded-full p-1 flex justify-end">
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                     </div>
                  </div>
               ))}
            </div>
         </section>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full py-5 bg-white border-2 border-red-100 text-red-500 font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95"
      >
        <LogOut className="w-6 h-6" />
        Logout Session
      </button>

      <p className="text-center text-[10px] font-mono text-slate-300 mt-12 uppercase tracking-[0.4em] opacity-40">Velveth Lending App v1.0.4</p>

      <BottomNav />
    </div>
  );
}
