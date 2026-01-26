// Types
export interface Friend {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  friendId: string;
  purpose: string;
  tags: string[];
  createdAt: string;
  isPaid: boolean;
  paidAt?: string;
}

export interface AppData {
  friends: Friend[];
  expenses: Expense[];
}

const STORAGE_KEY = 'settleup-data';

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Default emojis for friends
export const friendEmojis = ['😊', '🌟', '💫', '🎯', '🌸', '🍀', '🦋', '🐱', '🌈', '☀️', '🎨', '🎵'];

// Get random emoji
export const getRandomEmoji = (): string => {
  return friendEmojis[Math.floor(Math.random() * friendEmojis.length)];
};

// Load data from localStorage
export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return { friends: [], expenses: [] };
};

// Save data to localStorage
export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Friend operations
export const addFriend = (name: string): Friend => {
  const data = loadData();
  const newFriend: Friend = {
    id: generateId(),
    name: name.trim(),
    emoji: getRandomEmoji(),
    createdAt: new Date().toISOString(),
  };
  data.friends.push(newFriend);
  saveData(data);
  return newFriend;
};

export const getFriends = (): Friend[] => {
  return loadData().friends;
};

export const getFriendById = (id: string): Friend | undefined => {
  return loadData().friends.find(f => f.id === id);
};

// Expense operations
export const addExpense = (expense: Omit<Expense, 'id' | 'createdAt' | 'isPaid'>): Expense => {
  const data = loadData();
  const newExpense: Expense = {
    ...expense,
    id: generateId(),
    createdAt: new Date().toISOString(),
    isPaid: false,
  };
  data.expenses.push(newExpense);
  saveData(data);
  return newExpense;
};

export const getExpenses = (): Expense[] => {
  return loadData().expenses;
};

export const markExpenseAsPaid = (expenseId: string): void => {
  const data = loadData();
  const expense = data.expenses.find(e => e.id === expenseId);
  if (expense) {
    expense.isPaid = true;
    expense.paidAt = new Date().toISOString();
    saveData(data);
  }
};

export const markAllExpensesPaidForFriend = (friendId: string): void => {
  const data = loadData();
  data.expenses.forEach(expense => {
    if (expense.friendId === friendId && !expense.isPaid) {
      expense.isPaid = true;
      expense.paidAt = new Date().toISOString();
    }
  });
  saveData(data);
};

// Calculate balances
export const getFriendBalance = (friendId: string): number => {
  const expenses = loadData().expenses;
  return expenses
    .filter(e => e.friendId === friendId && !e.isPaid)
    .reduce((sum, e) => sum + e.amount, 0);
};

export const getTotalPending = (): number => {
  const expenses = loadData().expenses;
  return expenses
    .filter(e => !e.isPaid)
    .reduce((sum, e) => sum + e.amount, 0);
};

export const getPendingExpensesForFriend = (friendId: string): Expense[] => {
  return loadData().expenses.filter(e => e.friendId === friendId && !e.isPaid);
};

export const getSettledExpensesForFriend = (friendId: string): Expense[] => {
  return loadData().expenses.filter(e => e.friendId === friendId && e.isPaid);
};

export const getRecentActivity = (limit: number = 5): Expense[] => {
  const expenses = loadData().expenses;
  return expenses
    .sort((a, b) => {
      const dateA = a.paidAt || a.createdAt;
      const dateB = b.paidAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, limit);
};

export const getTopOwedFriends = (limit: number = 3): { friend: Friend; amount: number }[] => {
  const data = loadData();
  const friendBalances = data.friends.map(friend => ({
    friend,
    amount: getFriendBalance(friend.id),
  }));
  
  return friendBalances
    .filter(fb => fb.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format relative time
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short' 
  });
};
