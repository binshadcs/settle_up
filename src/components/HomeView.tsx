import { motion } from 'framer-motion';
import { TrendingUp, Clock, ArrowUpRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getTotalPending, 
  getTopOwedFriends, 
  getRecentActivity, 
  formatCurrency,
  formatRelativeTime,
  getFriendById,
  Friend,
  Expense
} from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface HomeViewProps {
  refreshKey: number;
}

const HomeView = ({ refreshKey }: HomeViewProps) => {
  const [totalPending, setTotalPending] = useState(0);
  const [topFriends, setTopFriends] = useState<{ friend: Friend; amount: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<Expense[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setTotalPending(getTotalPending());
    setTopFriends(getTopOwedFriends(3));
    setRecentActivity(getRecentActivity(5));
  }, [refreshKey]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
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
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Welcome back</p>
          <h1 className="text-2xl font-bold text-foreground">Your Summary</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(user ? '/profile' : '/auth')}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
        >
          <User className="w-5 h-5 text-foreground" />
        </motion.button>
      </motion.div>

      {/* Total Pending Card */}
      <motion.div
        variants={itemVariants}
        className="card-elevated p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Total Pending</span>
          </div>
          <p className="text-4xl font-bold text-foreground amount-display">
            {formatCurrency(totalPending)}
          </p>
          {totalPending === 0 && (
            <p className="text-sm text-success mt-2 font-medium">All clear! No pending dues 🎉</p>
          )}
        </div>
      </motion.div>

      {/* Top Friends Owed */}
      {topFriends.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Top Owed
          </h2>
          <div className="space-y-2">
            {topFriends.map(({ friend, amount }, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-flat p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                    {friend.emoji}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-warning amount-display">
                    {formatCurrency(amount)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Activity
        </h2>
        
        {recentActivity.length === 0 ? (
          <div className="card-flat p-8 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No activity yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add your first expense to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((expense, index) => {
              const friend = getFriendById(expense.friendId);
              if (!friend) return null;
              
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{friend.emoji}</span>
                    <div>
                      <p className="font-medium text-foreground text-sm">{expense.purpose}</p>
                      <p className="text-xs text-muted-foreground">
                        {friend.name} • {formatRelativeTime(expense.paidAt || expense.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm amount-display ${
                      expense.isPaid ? 'text-success' : 'text-foreground'
                    }`}>
                      {expense.isPaid ? '✓ ' : ''}{formatCurrency(expense.amount)}
                    </span>
                    {!expense.isPaid && (
                      <span className="badge-pending">Pending</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Empty State */}
      {totalPending === 0 && recentActivity.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowUpRight className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Ready to track expenses?</h3>
          <p className="text-sm text-muted-foreground">
            Tap the + button to add your first expense
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HomeView;
