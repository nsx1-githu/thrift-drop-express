import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { forwardRef } from 'react';

// Animation variants for reuse across the app
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 }
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

export const buttonPress: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  tap: { 
    scale: 0.96,
    transition: { duration: 0.1 }
  }
};

export const navItemVariants: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.9, transition: { duration: 0.1 } }
};

// Page transition wrapper
interface PageTransitionProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
PageTransition.displayName = 'PageTransition';

// Motion card with hover glow
interface MotionCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  enableGlow?: boolean;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ children, className, enableGlow = true, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={cardHover}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
MotionCard.displayName = 'MotionCard';

// Motion button with press feedback
interface MotionButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, ...props }, ref) => (
    <motion.button
      ref={ref}
      variants={buttonPress}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
);
MotionButton.displayName = 'MotionButton';

// Stagger children animation wrapper
interface StaggerWrapperProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

export const StaggerWrapper = forwardRef<HTMLDivElement, StaggerWrapperProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerWrapper.displayName = 'StaggerWrapper';

// Individual stagger item
interface StaggerItemProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerItem.displayName = 'StaggerItem';

// Glow effect component
export const GlowEffect = ({ className = '' }: { className?: string }) => (
  <motion.div
    className={`absolute inset-0 rounded-[inherit] bg-primary/10 blur-xl -z-10 ${className}`}
    initial={{ opacity: 0, scale: 0.8 }}
    whileHover={{ opacity: 1, scale: 1.1 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  />
);

export { motion };
