import { motion } from 'framer-motion';
import { Users, ChevronRight, Plus, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  Friend, 
  getFriends, 
  getFriendBalance, 
  formatCurrency,
  addFriend,
  getPendingExpensesForFriend,
  getSettledExpensesForFriend,
  Expense
} from '@/lib/storage';
import FriendDetailSheet from './FriendDetailSheet';

interface FriendsViewProps {
  refreshKey: number;
  onRefresh: () => void;
}

const FriendsView = ({ refreshKey, onRefresh }: FriendsViewProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [balances, setBalances] = useState<Map<string, number>>(new Map());
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  useEffect(() => {
    const friendsList = getFriends();
    setFriends(friendsList);
    
    const newBalances = new Map<string, number>();
    friendsList.forEach(friend => {
      newBalances.set(friend.id, getFriendBalance(friend.id));
    });
    setBalances(newBalances);
  }, [refreshKey]);

  const handleAddFriend = () => {
    if (newFriendName.trim()) {
      addFriend(newFriendName);
      setNewFriendName('');
      setShowAddFriend(false);
      onRefresh();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Friends</h1>
            <p className="text-sm text-muted-foreground">
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddFriend(true)}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
          >
            <UserPlus className="w-5 h-5 text-primary-foreground" />
          </motion.button>
        </motion.div>

        {/* Add Friend Input */}
        {showAddFriend && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card-elevated p-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                placeholder="Friend's name"
                autoFocus
                className="flex-1 input-field"
                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddFriend}
                disabled={!newFriendName.trim()}
                className="btn-primary px-4 disabled:opacity-50"
              >
                Add
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Friends List */}
        {friends.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No friends yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add friends who pay on your behalf
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddFriend(true)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Friend
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend, index) => {
              const balance = balances.get(friend.id) || 0;
              
              return (
                <motion.button
                  key={friend.id}
                  variants={itemVariants}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedFriend(friend)}
                  className="w-full card-elevated p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl">
                      {friend.emoji}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{friend.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {balance > 0 ? 'You owe' : 'All settled'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {balance > 0 ? (
                      <span className="font-bold text-warning amount-display">
                        {formatCurrency(balance)}
                      </span>
                    ) : (
                      <span className="text-sm text-success font-medium">✓ Clear</span>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Friend Detail Sheet */}
      <FriendDetailSheet
        friend={selectedFriend}
        isOpen={!!selectedFriend}
        onClose={() => setSelectedFriend(null)}
        onRefresh={onRefresh}
      />
    </>
  );
};

export default FriendsView;
