import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1554224155-1696413565d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")',
          filter: 'brightness(0.3) saturate(0.5)'
        }}
      />
      <div className="absolute inset-0 z-0 bg-brand/60" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md text-center text-white"
      >
        <h1 className="text-4xl font-display font-bold mb-2 tracking-tight">VLC App</h1>
        <p className="text-sm opacity-80 mb-12 italic">Ask ?</p>

        <h2 className="text-3xl font-display font-bold mb-4 leading-tight">
          Fast & Reliable Lending Solutions
        </h2>
        <p className="text-sm mb-12 leading-relaxed opacity-90 px-4 capitalize">
          Experience seamless account access with the Velveth Lending App. Take control of your loan anytime and anywhere.
        </p>

        <div className="space-y-4 px-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-white text-brand font-bold rounded-lg shadow-xl hover:bg-white/90 transition-colors"
          >
            Sign In
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
            className="w-full py-4 bg-brand text-white font-bold rounded-lg border border-white/20 shadow-xl hover:bg-brand/90 transition-colors"
          >
            Register
          </motion.button>
        </div>
      </motion.div>

      {/* Foreground Coins/Decoration */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand/30 rounded-full blur-3xl" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
    </div>
  );
}
