import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReservationTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export const ReservationTimer = ({ expiresAt, onExpire }: ReservationTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = Math.max(0, Math.floor((expiry - now) / 1000));
    return diff;
  }, [expiresAt]);

  useEffect(() => {
    // Initial calculation
    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    
    if (initial <= 0) {
      setIsExpired(true);
      onExpire();
      return;
    }

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setIsExpired(true);
        onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = Math.min(100, (timeLeft / 600) * 100); // 600 seconds = 10 minutes

  if (isExpired) {
    return (
      <motion.div 
        className="p-4 bg-destructive/10 rounded-xl border border-destructive/20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-semibold">Reservation Expired</p>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Please place the order again.
        </p>
      </motion.div>
    );
  }

  const isLowTime = timeLeft <= 60; // Last minute warning

  return (
    <motion.div 
      className={`p-4 rounded-xl border ${
        isLowTime 
          ? 'bg-destructive/10 border-destructive/20' 
          : 'bg-primary/10 border-primary/20'
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${isLowTime ? 'text-destructive' : 'text-primary'}`} />
          <div>
            <p className={`font-semibold ${isLowTime ? 'text-destructive' : 'text-primary'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <p className="text-xs text-muted-foreground">Time remaining</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${isLowTime ? 'bg-destructive' : 'bg-primary'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        ⏱ This item is reserved for you. Complete payment within the time to confirm your order.
      </p>
    </motion.div>
  );
};
