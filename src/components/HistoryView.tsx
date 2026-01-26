import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight, Check } from 'lucide-react';
import { 
  getExpenses, 
  getFriendById, 
  formatCurrency, 
  formatRelativeTime,
  Expense 
} from '@/lib/storage';

interface HistoryViewProps {
  refreshKey: number;
}

const HistoryView = ({ refreshKey }: HistoryViewProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('all');

  useEffect(() => {
    const allExpenses = getExpenses();
    // Sort by most recent first
    const sorted = allExpenses.sort((a, b) => {
      const dateA = a.paidAt || a.createdAt;
      const dateB = b.paidAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    setExpenses(sorted);
  }, [refreshKey]);

  const filteredExpenses = expenses.filter(expense => {
    if (filter === 'pending') return !expense.isPaid;
    if (filter === 'settled') return expense.isPaid;
    return true;
  });

  const groupedByDate = filteredExpenses.reduce((groups, expense) => {
    const date = new Date(expense.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">History</h1>
          <p className="text-muted-foreground text-sm mt-1">All your transactions</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
        {(['all', 'pending', 'settled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === tab 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-6">
        {Object.keys(groupedByDate).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first expense to see history
            </p>
          </motion.div>
        ) : (
          Object.entries(groupedByDate).map(([date, dateExpenses], groupIndex) => (
            <div key={date} className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {date}
              </h3>
              <div className="space-y-2">
                {dateExpenses.map((expense, index) => {
                  const friend = getFriendById(expense.friendId);
                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.05 + index * 0.03 }}
                      className="card-elevated p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                          {friend?.emoji || '👤'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">
                              {expense.purpose || 'Payment'}
                            </p>
                            {expense.isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                                <Check className="w-3 h-3" />
                                Settled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <ArrowUpRight className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {friend?.name || 'Unknown'} • {formatRelativeTime(expense.createdAt)}
                          </p>
                        </div>
                        <p className={`font-semibold ${expense.isPaid ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                      {expense.tags && expense.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {expense.tags.map((tag, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryView;
