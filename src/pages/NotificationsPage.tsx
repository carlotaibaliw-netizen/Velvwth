import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Notification as NotificationType } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Trash2, CheckCircle2, Wallet, X } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function NotificationsPage({ profile }: { profile: UserProfile | null }) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<NotificationType | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [profile.uid, 'user-all']), // user-all for broadcast
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationType)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsub();
  }, [profile]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const handleNotifClick = (notif: NotificationType) => {
    setSelectedNotif(notif);
    if (!notif.isRead) markAsRead(notif.id);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <header className="flex items-center gap-4 mb-8 bg-brand p-4 -mx-4 -mt-4 text-white">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">Notifications</h1>
      </header>

      <div className="flex justify-between items-center mb-6">
        {unreadCount > 0 && <span className="bg-brand text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{unreadCount} Unread</span>}
        <button className="text-brand text-xs font-black uppercase tracking-widest hover:underline ml-auto">Mark all as read</button>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <motion.div 
            key={notif.id}
            onClick={() => handleNotifClick(notif)}
            layoutId={notif.id}
            className={cn(
               "p-4 rounded-xl shadow-md border transition-all cursor-pointer relative overflow-hidden flex gap-4",
               notif.isRead ? "bg-slate-50 border-slate-100" : "bg-white border-brand/20 ring-1 ring-brand/10"
            )}
          >
             <div className={cn(
               "w-12 h-12 rounded-full shrink-0 flex items-center justify-center",
               notif.type === 'payment' ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
             )}>
                {notif.type === 'payment' ? <CheckCircle2 className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
             </div>
             
             <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 mb-1">
                   <h3 className={cn("text-xs font-bold truncate", !notif.isRead ? "text-slate-900" : "text-slate-500 font-medium")}>{notif.title}</h3>
                   {!notif.isRead && <div className="w-2 h-2 bg-brand rounded-full shrink-0 animate-pulse" />}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                <p className="text-[8px] text-slate-400 mt-2 font-medium">1 week ago</p>
             </div>

             <button 
                onClick={(e) => deleteNotif(notif.id, e)}
                className="absolute top-4 right-4 p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
             >
                <Trash2 className="w-4 h-4" />
             </button>
          </motion.div>
        ))}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
             <Bell className="w-20 h-20 mb-4" />
             <p className="font-display font-black uppercase text-xs tracking-[0.2em]">No Notifications</p>
          </div>
        )}
      </div>

      {/* Notification Detail Overlay */}
      <AnimatePresence>
        {selectedNotif && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
             <motion.div layoutId={selectedNotif.id} className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-slate-100">
                <button onClick={() => setSelectedNotif(null)} className="absolute right-4 top-4 p-2 hover:bg-slate-100 rounded-full z-20">
                   <X className="w-5 h-5 text-slate-400" />
                </button>

                <div className="p-8 pb-4">
                   <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                      <Bell className="w-8 h-8 text-brand" />
                   </div>
                   <h2 className="text-xl font-display font-black text-slate-800 mb-2 leading-tight uppercase tracking-tighter">{selectedNotif.title}</h2>
                   <div className="h-0.5 w-12 bg-brand mb-6" />
                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic opacity-80 select-none">“ {selectedNotif.message} ”</p>
                   </div>
                </div>

                <div className="p-8 pt-4 space-y-3">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Action Required</p>
                   <button 
                      onClick={() => navigate('/make-payment')}
                      className="w-full py-4 bg-brand text-white font-black rounded-xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all"
                   >
                     <Wallet className="w-5 h-5" />
                     Pay Now
                   </button>
                   <button 
                      onClick={() => setSelectedNotif(null)}
                      className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-brand transition-colors"
                   >
                     Dismiss
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
