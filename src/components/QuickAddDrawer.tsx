import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronDown, Delete } from 'lucide-react';
import {
  Friend,
  getFriends,
  addFriend,
  addExpense,
  getRandomEmoji
} from '@/lib/storage';

interface QuickAddDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
}

const quickPurposes = ['Food', 'Transport', 'Coffee', 'Shopping', 'Bills', 'Other'];

const QuickAddDrawer = ({ isOpen, onClose, onExpenseAdded }: QuickAddDrawerProps) => {
  const [amount, setAmount] = useState<string>('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [purpose, setPurpose] = useState<string>('');
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (isOpen) {
      setFriends(getFriends());
      setAmount('');
      setSelectedFriend(null);
      setPurpose('');
      setStep(1);
      setShowFriendPicker(false);
      setNewFriendName('');
    }
  }, [isOpen]);

  const handleAddFriend = () => {
    if (newFriendName.trim()) {
      const newFriend = addFriend(newFriendName);
      setFriends(prev => [...prev, newFriend]);
      setSelectedFriend(newFriend);
      setNewFriendName('');
      setShowFriendPicker(false);
    }
  };

  const handleSubmit = () => {
    if (!amount || !selectedFriend) return;

    addExpense({
      amount: parseFloat(amount),
      friendId: selectedFriend.id,
      purpose: purpose || 'Expense',
      tags: [],
    });

    onExpenseAdded();
    onClose();
  };

  const canProceed = () => {
    if (step === 1) return !!amount && parseFloat(amount) > 0;
    if (step === 2) return !!selectedFriend;
    return true;
  };

  const handleNumpadPress = (key: string) => {
    if (key === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount(prev => prev + '.');
      }
    } else {
      // Limit to reasonable amount (max 7 digits before decimal, 2 after)
      const parts = amount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      if (!parts[1] && parts[0].length >= 7) return;
      setAmount(prev => prev + key);
    }
  };

  const numpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2 safe-area-inset">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <h2 className="text-lg font-semibold text-foreground">Add Expense</h2>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Step Indicator */}
          <div className="px-5 py-3">
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    s <= step ? 'bg-primary' : 'bg-muted'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col px-5 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Step 1: Amount with Numpad */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col"
                >
                  {/* Amount Display */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground mb-2">
                      How much?
                    </span>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-semibold text-muted-foreground mr-1">₹</span>
                      <span className="text-6xl font-bold text-foreground amount-display min-h-[72px]">
                        {amount || '0'}
                      </span>
                    </div>
                  </div>

                  {/* Numpad */}
                  <div className="pb-4">
                    <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                      {numpadKeys.flat().map((key) => (
                        <motion.button
                          key={key}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleNumpadPress(key)}
                          className={`h-16 rounded-2xl text-2xl font-semibold transition-colors ${
                            key === 'backspace'
                              ? 'bg-secondary text-muted-foreground'
                              : 'bg-secondary text-foreground hover:bg-secondary/80'
                            } flex items-center justify-center`}
                        >
                          {key === 'backspace' ? (
                            <Delete className="w-6 h-6" />
                          ) : (
                            key
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Friend */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col py-4 min-h-0"
                >
                  <label className="text-sm font-medium text-muted-foreground block mb-4 text-center">
                    Who paid?
                  </label>
                  {/* Add new friend */}
                  <div className="flex gap-2 my-4 pt-4 border-t border-border">
                    <input
                      type="text"
                      value={newFriendName}
                      onChange={(e) => setNewFriendName(e.target.value)}
                      placeholder="Add new friend"
                      className="flex-1 input-field"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddFriend}
                      disabled={!newFriendName.trim()}
                      className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5 text-primary-foreground" />
                    </motion.button>
                  </div>

                  {/* Friend Selector */}
                  <button
                    onClick={() => setShowFriendPicker(!showFriendPicker)}
                    className="w-full flex items-center justify-between p-4 bg-secondary rounded-xl mb-4"
                  >
                    {selectedFriend ? (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedFriend.emoji}</span>
                        <span className="font-medium text-foreground">{selectedFriend.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select a friend</span>
                    )}
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showFriendPicker ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Friend List */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <div className="space-y-2">

                      {friends.map((friend) => (
                        <motion.button
                          key={friend.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedFriend(friend);
                            setShowFriendPicker(false);
                          }}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                            selectedFriend?.id === friend.id
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-muted hover:bg-muted/80'
                            }`}
                        >
                          <span className="text-2xl">{friend.emoji}</span>
                          <span className="font-medium text-foreground">{friend.name}</span>
                        </motion.button>
                      ))}


                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Purpose */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col py-4"
                >
                  <label className="text-sm font-medium text-muted-foreground block mb-4 text-center">
                    What for? (optional)
                  </label>

                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., Lunch, Auto, etc."
                    className="input-field mb-4"
                  />

                  {/* Quick purposes */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {quickPurposes.map((p) => (
                      <motion.button
                        key={p}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPurpose(p)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          purpose === p
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                          }`}
                      >
                        {p}
                      </motion.button>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-auto p-5 bg-secondary/50 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="text-xl font-bold text-foreground amount-display">₹{amount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Paid by</span>
                      <span className="font-medium text-foreground flex items-center gap-2">
                        <span className="text-xl">{selectedFriend?.emoji}</span>
                        {selectedFriend?.name}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="px-5 pb-8 pt-4 safe-area-inset">
            <div className="flex gap-3">
              {step > 1 && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                  className="btn-secondary flex-1"
                >
                  Back
                </motion.button>
              )}

              {step < 3 ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                  disabled={!canProceed()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  Next
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="btn-primary flex-1"
                >
                  Add Expense
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickAddDrawer;
