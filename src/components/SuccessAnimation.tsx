import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, Sparkles, Trophy } from 'lucide-react';
import { formatCurrency } from '@/lib/storage';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  remainingCount?: number;
  settledAmount?: number;
}

const encouragingMessages = [
  "Keep going! 🔥",
  "You're on fire!",
  "Nice one!",
  "Crushing it!",
  "Almost there!",
  "Great progress!",
];

const SuccessAnimation = ({ show, message, remainingCount = 0, settledAmount }: SuccessAnimationProps) => {
  const showEncouragement = remainingCount > 0;
  
  const displayMessage = message || (
    remainingCount === 0 
      ? "All done! 🎉" 
      : encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]
  );

  const Icon = remainingCount === 0 ? Trophy : remainingCount <= 2 ? Sparkles : Flame;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          {/* Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative flex flex-col items-center gap-4"
          >
            {/* Checkmark circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-success flex items-center justify-center"
              style={{ boxShadow: '0 0 60px hsl(145 60% 45% / 0.4)' }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Check className="w-10 h-10 text-success-foreground" strokeWidth={3} />
              </motion.div>
            </motion.div>
            
            {/* Settled Amount */}
            {settledAmount !== undefined && settledAmount > 0 && (
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-success amount-display"
              >
                {formatCurrency(settledAmount)}
              </motion.p>
            )}

            {/* Message */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg font-semibold text-foreground"
            >
              {displayMessage}
            </motion.p>

            {/* Remaining count badge */}
            {showEncouragement && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning"
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {remainingCount} more to go!
                </span>
              </motion.div>
            )}

            {/* Confetti-like particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  scale: 0, 
                  x: 0, 
                  y: 0,
                  rotate: 0 
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  x: (i % 2 === 0 ? 1 : -1) * (30 + i * 15),
                  y: -40 - i * 10,
                  rotate: (i % 2 === 0 ? 1 : -1) * 180
                }}
                transition={{ 
                  delay: 0.2 + i * 0.05,
                  duration: 0.6,
                  ease: 'easeOut'
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: [
                    'hsl(45 100% 51%)',
                    'hsl(145 60% 45%)',
                    'hsl(35 100% 55%)',
                    'hsl(200 80% 60%)',
                    'hsl(340 80% 65%)',
                    'hsl(280 70% 60%)',
                  ][i]
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAnimation;
