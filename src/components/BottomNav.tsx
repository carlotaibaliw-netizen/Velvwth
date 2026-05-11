import { Home, Bell, Wallet, AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', icon: Home, path: '/dashboard' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
    { label: 'Pay', icon: Wallet, path: '/make-payment' },
    { label: 'Penalties', icon: AlertTriangle, path: '/penalties' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand text-white flex justify-around items-end pb-2 pt-1 border-t border-white/10 z-40 lg:max-w-md lg:mx-auto">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button 
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center p-2 transition-all",
              isActive ? "text-white" : "text-white/60 hover:text-white/80"
            )}
          >
            <item.icon className={cn("w-6 h-6 mb-1", isActive && "scale-110")} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />}
          </button>
        );
      })}
    </nav>
  );
}
