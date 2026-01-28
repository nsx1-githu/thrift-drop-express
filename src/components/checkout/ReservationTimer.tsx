import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface ReservationTimerProps {
  expiresAt: Date;
  onExpire: () => void;
}

export const ReservationTimer = ({ expiresAt, onExpire }: ReservationTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = Math.max(0, expiry - now);
    return Math.floor(diff / 1000);
  }, [expiresAt]);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0 && !hasExpired) {
        setHasExpired(true);
        onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, onExpire, hasExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft <= 120; // Less than 2 minutes
  const isCritical = timeLeft <= 60; // Less than 1 minute

  if (hasExpired) {
    return (
      <motion.div
        className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Reservation Expired</p>
            <p className="text-sm text-muted-foreground">Please place the order again.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`p-4 rounded-xl border ${
        isCritical
          ? 'bg-destructive/10 border-destructive/30'
          : isLow
          ? 'bg-status-pending/10 border-status-pending/30'
          : 'bg-primary/10 border-primary/30'
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
          >
            <Clock className={`w-5 h-5 ${
              isCritical ? 'text-destructive' : isLow ? 'text-status-pending' : 'text-primary'
            }`} />
          </motion.div>
          <div>
            <p className={`text-sm font-medium ${
              isCritical ? 'text-destructive' : isLow ? 'text-status-pending' : 'text-foreground'
            }`}>
              This item is reserved for you
            </p>
            <p className="text-xs text-muted-foreground">
              Complete payment within the time to confirm your order
            </p>
          </div>
        </div>
        <motion.div
          className={`text-2xl font-mono font-bold tabular-nums ${
            isCritical ? 'text-destructive' : isLow ? 'text-status-pending' : 'text-primary'
          }`}
          animate={isCritical ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.div>
      </div>
    </motion.div>
  );
};
