import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCircle2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  Friend,
  Expense,
  getFriends,
  getFriendBalance,
  getPendingExpensesForFriend,
  markExpenseAsPaid,
  markAllExpensesPaidForFriend,
  getTotalPending,
  formatCurrency,
  formatRelativeTime
} from '@/lib/storage';
import SuccessAnimation from './SuccessAnimation';

interface SettleViewProps {
  refreshKey: number;
  onRefresh: () => void;
}

interface FriendWithPending {
  friend: Friend;
  balance: number;
  expenses: Expense[];
}

const SettleView = ({ refreshKey, onRefresh }: SettleViewProps) => {
  const [friendsWithPending, setFriendsWithPending] = useState<FriendWithPending[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedFriend, setExpandedFriend] = useState<string | null>(null);
  const [remainingCount, setRemainingCount] = useState(0);
  const [settledAmount, setSettledAmount] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = () => {
    const friends = getFriends();
    const pending = friends
      .map(friend => ({
        friend,
        balance: getFriendBalance(friend.id),
        expenses: getPendingExpensesForFriend(friend.id),
      }))
      .filter(f => f.balance > 0);
    
    setFriendsWithPending(pending);
    setTotalPending(getTotalPending());
  };

  const handleMarkPaid = (expenseId: string, friendId: string) => {
    markExpenseAsPaid(expenseId);
    loadData();
    onRefresh();
    
    // Calculate remaining and show success
    const remaining = friendsWithPending.reduce((acc, f) => acc + f.expenses.length, 0) - 1;
    setRemainingCount(remaining);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1800);
  };

  const handleSettleFriend = (friendId: string) => {
    const friendData = friendsWithPending.find(f => f.friend.id === friendId);
    const amount = friendData?.balance || 0;
    
    markAllExpensesPaidForFriend(friendId);
    loadData();
    onRefresh();
    
    const remaining = friendsWithPending.filter(f => f.friend.id !== friendId).reduce((acc, f) => acc + f.expenses.length, 0);
    setRemainingCount(remaining);
    setSettledAmount(amount);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const handleSettleAll = () => {
    friendsWithPending.forEach(({ friend }) => {
      markAllExpensesPaidForFriend(friend.id);
    });
    loadData();
    onRefresh();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground">Settle Up</h1>
        <p className="text-sm text-muted-foreground">Mark payments as complete</p>
      </motion.div>

      {/* Total Card */}
      {totalPending > 0 && (
        <motion.div
          variants={itemVariants}
          className="card-elevated p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground">Total to settle</p>
            <p className="text-2xl font-bold text-foreground amount-display">
              {formatCurrency(totalPending)}
            </p>
          </div>
          {friendsWithPending.length > 1 && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSettleAll}
              className="btn-primary px-4 py-2 text-sm"
            >
              Settle All
            </motion.button>
          )}
        </motion.div>
      )}

      {/* All Clear State */}
      {totalPending === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-success" />
          </motion.div>
          <h3 className="text-xl font-bold text-foreground mb-2">All Clear!</h3>
          <p className="text-muted-foreground">
            You have no pending payments. Great job! 🎉
          </p>
        </motion.div>
      )}

      {/* Friends with pending */}
      <div className="space-y-3">
        {friendsWithPending.map(({ friend, balance, expenses }) => (
          <motion.div
            key={friend.id}
            variants={itemVariants}
            layout
            className="card-elevated overflow-hidden"
          >
            {/* Friend Header */}
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={() => setExpandedFriend(
                expandedFriend === friend.id ? null : friend.id
              )}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-xl">
                  {friend.emoji}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">{friend.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {expenses.length} pending {expenses.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-warning amount-display">
                  {formatCurrency(balance)}
                </span>
                <motion.div
                  animate={{ rotate: expandedFriend === friend.id ? 180 : 0 }}
                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
            </motion.button>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedFriend === friend.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    {expenses.map((expense) => (
                      <motion.div
                        key={expense.id}
                        layout
                        className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-foreground text-sm">{expense.purpose}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(expense.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm amount-display">
                            {formatCurrency(expense.amount)}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkPaid(expense.id, friend.id);
                            }}
                            className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center hover:bg-success/20 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5 text-success" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Settle All for Friend */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSettleFriend(friend.id)}
                      className="w-full mt-2 py-3 rounded-xl bg-success text-success-foreground font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark All as Paid
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Success Animation */}
      <SuccessAnimation show={showSuccess} remainingCount={remainingCount} settledAmount={settledAmount} />
    </motion.div>
  );
};

export default SettleView;
