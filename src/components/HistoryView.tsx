import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight, Check } from 'lucide-react';
import { 
  getExpenses, 
  getActivities,
  getFriendById, 
  formatCurrency, 
  formatShortDate,
  Expense 
} from '@/lib/storage';

interface HistoryViewProps {
  refreshKey: number;
}

interface ActivityItem {
  type: 'created' | 'payment' | 'settled';
  date: string;
  amount: number;
  expense: Expense;
}

const HistoryView = ({ refreshKey }: HistoryViewProps) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const allExpenses = getExpenses();
    const expenseMap = new Map(allExpenses.map((e) => [e.id, e]));
    const activityList = getActivities().map((activity) => ({
      type: activity.type,
      date: activity.createdAt,
      amount: Number.isFinite(activity.amount) ? activity.amount : 0,
      expense: expenseMap.get(activity.expenseId),
    })).filter((a): a is ActivityItem => !!a.expense);
    setActivities(activityList);
  }, [refreshKey]);

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'pending') return activity.type === 'created' && !activity.expense.isPaid;
    if (filter === 'settled') return activity.type !== 'created';
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const groupedByDate = filteredActivities.reduce((groups, activity) => {
    const date = formatShortDate(activity.date);
    if (!groups[date]) groups[date] = [];
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

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
                {dateExpenses.map((activity, index) => {
                  const { expense } = activity;
                  const friend = getFriendById(expense.friendId);
                  const label = activity.type === 'settled' ? 'Settled' : activity.type === 'payment' ? 'Paid' : 'Created';
                  const amount = Number.isFinite(activity.amount)
                    ? (activity.type === 'created' ? expense.amount : activity.amount)
                    : 0;
                  return (
                    <motion.div
                      key={`${expense.id}-${activity.type}-${activity.date}-${index}`}
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
                            {activity.type === 'settled' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                                <Check className="w-3 h-3" />
                                Settled
                              </span>
                            ) : activity.type === 'payment' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <ArrowUpRight className="w-3 h-3" />
                                Created
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {friend?.name || 'Unknown'} • {label} {formatShortDate(activity.date)}
                          </p>
                        </div>
                        <p className={`font-semibold ${activity.type === 'settled' ? 'text-muted-foreground' : activity.type === 'payment' ? 'text-warning' : 'text-foreground'}`}>
                          {formatCurrency(amount)}
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
