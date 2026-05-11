import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Role, UserProfile } from './types';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ApplyLoan from './pages/ApplyLoan';
import MyLoans from './pages/MyLoans';
import MakePayment from './pages/MakePayment';
import ManageAccount from './pages/ManageAccount';
import NotificationsPage from './pages/NotificationsPage';
import PenaltiesPage from './pages/PenaltiesPage';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f3e8e8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#802020]"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f3e8e8] font-sans selection:bg-[#802020] selection:text-white">
        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
          
          <Route 
            path="/dashboard" 
            element={user ? (profile?.role === Role.ADMIN ? <AdminDashboard /> : <Dashboard profile={profile} />) : <Navigate to="/" />} 
          />
          
          {/* User Routes */}
          <Route path="/apply-loan" element={user ? <ApplyLoan profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/my-loans" element={user ? <MyLoans profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/make-payment" element={user ? <MakePayment profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/manage-account" element={user ? <ManageAccount profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={user ? <NotificationsPage profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/penalties" element={user ? <PenaltiesPage profile={profile} /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
