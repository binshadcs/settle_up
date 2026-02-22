import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, History } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  Friend, 
  Expense,
  getPendingExpensesForFriend,
  getSettledExpensesForFriend,
  getActivitiesForFriend,
  getFriendBalance,
  markExpenseAsPaid,
  markAllExpensesPaidForFriend,
  formatCurrency,
  formatRelativeTime,
  applyPaymentForFriend,
  getExpenseRemainingAmount,
  formatShortDate,
  Activity
} from '@/lib/storage';
import SuccessAnimation from './SuccessAnimation';

interface FriendDetailSheetProps {
  friend: Friend | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const FriendDetailSheet = ({ friend, isOpen, onClose, onRefresh }: FriendDetailSheetProps) => {
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [settledExpenses, setSettledExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [partialPayment, setPartialPayment] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (friend) {
      setPendingExpenses(getPendingExpensesForFriend(friend.id));
      setSettledExpenses(getSettledExpensesForFriend(friend.id));
      setBalance(getFriendBalance(friend.id));
      setActivities(getActivitiesForFriend(friend.id));
      setActiveTab('pending');
    }
  }, [friend, isOpen]);

  const handleMarkPaid = (expenseId: string) => {
    markExpenseAsPaid(expenseId);
    if (friend) {
      const newPending = getPendingExpensesForFriend(friend.id);
      setPendingExpenses(newPending);
      setSettledExpenses(getSettledExpensesForFriend(friend.id));
      setBalance(getFriendBalance(friend.id));
      setActivities(getActivitiesForFriend(friend.id));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1800);
    }
    onRefresh();
  };

  const handlePartialPayment = (amount: number) => {
    if (!friend) return;
    applyPaymentForFriend(friend.id, amount);
    if (friend) {
      const newPending = getPendingExpensesForFriend(friend.id);
      setPendingExpenses(newPending);
      setSettledExpenses(getSettledExpensesForFriend(friend.id));
      setBalance(getFriendBalance(friend.id));
      setActivities(getActivitiesForFriend(friend.id));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1800);
    }
    setPartialPayment('');
    onRefresh();
  };

  const handleSettleAll = () => {
    if (friend) {
      markAllExpensesPaidForFriend(friend.id);
      setPendingExpenses([]);
      setSettledExpenses(getSettledExpensesForFriend(friend.id));
      setBalance(0);
      setActivities(getActivitiesForFriend(friend.id));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onRefresh();
    }
  };

  if (!friend) return null;
  const expenseMap = new Map([...pendingExpenses, ...settledExpenses].map((e) => [e.id, e]));
  const activityItems = activities
    .map((activity) => ({
      ...activity,
      expense: expenseMap.get(activity.expenseId),
    }))
    .filter((item): item is Activity & { expense: Expense } => !!item.expense);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[90vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl">
                  {friend.emoji}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{friend.name}</h2>
                  {balance > 0 ? (
                    <p className="text-sm text-warning font-medium">You owe {formatCurrency(balance)}</p>
                  ) : (
                    <p className="text-sm text-success font-medium">All settled ✓</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-5 pb-4">
              <div className="flex gap-2 p-1 bg-muted rounded-xl">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'pending'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Pending ({pendingExpenses.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  <History className="w-4 h-4" />
                  History ({settledExpenses.length})
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 scrollbar-hide">
              {activeTab === 'pending' ? (
                <>
                  {pendingExpenses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                        <Check className="w-7 h-7 text-success" />
                      </div>
                      <p className="text-foreground font-medium">All clear!</p>
                      <p className="text-sm text-muted-foreground">No pending dues with {friend.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingExpenses.map((expense) => {
                        const remaining = getExpenseRemainingAmount(expense);
                        const paidSoFar = Math.max(0, expense.paidAmount || 0);
                        const showPaidInfo = paidSoFar > 0 && remaining > 0;

                        return (
                          <div key={expense.id} className="space-y-2">
                            <motion.div
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              className="card-flat p-4 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium text-foreground">{expense.purpose}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(expense.createdAt)}
                                </p>
                                {showPaidInfo && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Paid {formatCurrency(paidSoFar)} of {formatCurrency(expense.amount)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-foreground amount-display">
                                  {formatCurrency(remaining)}
                                </span>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleMarkPaid(expense.id)}
                                  className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center hover:bg-success/20 transition-colors"
                                >
                                  <Check className="w-4 h-4 text-success" />
                                </motion.button>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}

                      {(() => {
                        const parsedPayment = parseFloat(partialPayment);
                        const isOverpay = !Number.isNaN(parsedPayment) && parsedPayment > balance;
                        const canApply = !!partialPayment && !Number.isNaN(parsedPayment) && parsedPayment > 0 && !isOverpay;
                        return (
                          <>
                            <div className="flex items-center gap-2 px-1 mt-1">
                              <input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                max={balance}
                                placeholder="Partial payment"
                                value={partialPayment}
                                onChange={(e) => {
                                  const nextValue = e.target.value;
                                  const nextNumber = parseFloat(nextValue);
                                  if (!Number.isNaN(nextNumber) && nextNumber > balance) {
                                    setPartialPayment(balance.toString());
                                    return;
                                  }
                                  setPartialPayment(nextValue);
                                }}
                                className="flex-1 h-9 rounded-lg bg-muted/60 border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground"
                              />
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                disabled={!canApply}
                                onClick={() => {
                                  if (!canApply) return;
                                  handlePartialPayment(Math.min(balance, parsedPayment));
                                }}
                                className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                              >
                                Pay
                              </motion.button>
                            </div>
                            {isOverpay && (
                              <p className="text-xs text-warning px-1">
                                Amount cannot exceed {formatCurrency(balance)}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Settle All Button */}
                  {pendingExpenses.length > 1 && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSettleAll}
                      className="w-full mt-4 btn-primary"
                    >
                      Settle All ({formatCurrency(balance)})
                    </motion.button>
                  )}
                </>
              ) : (
                <>
                  {activityItems.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activityItems.map((activity) => {
                        const label = activity.type === 'settled' ? 'Settled' : activity.type === 'payment' ? 'Paid' : 'Created';
                        const amount = activity.type === 'created' ? activity.expense.amount : activity.amount;
                        return (
                        <div
                          key={activity.id}
                          className="py-3 flex items-center justify-between border-b border-border/50 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-foreground text-sm">{activity.expense.purpose}</p>
                            <p className="text-xs text-muted-foreground">
                              {label} {formatShortDate(activity.createdAt)}
                            </p>
                          </div>
                          <span className={`font-medium text-sm amount-display ${
                            activity.type === 'settled' ? 'text-success' : activity.type === 'payment' ? 'text-warning' : 'text-foreground'
                          }`}>
                            {activity.type === 'settled' ? '✓ ' : ''}{formatCurrency(amount)}
                          </span>
                        </div>
                      );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Success Animation */}
            <SuccessAnimation show={showSuccess} remainingCount={pendingExpenses.length} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FriendDetailSheet;
