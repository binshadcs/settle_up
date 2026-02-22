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
  paidAmount?: number;
}

export interface Activity {
  id: string;
  type: 'created' | 'payment' | 'settled';
  expenseId: string;
  friendId: string;
  amount: number;
  createdAt: string;
}

export interface AppData {
  friends: Friend[];
  expenses: Expense[];
  activities: Activity[];
}

const LEGACY_STORAGE_KEY = 'settleup-data';
const DB_NAME = 'idk';
const DB_VERSION = 1;
const STORE_NAME = 'app';
const STORE_RECORD_KEY = 'settleup-data';
let initialized = false;
let dbCache: AppData = { friends: [], expenses: [], activities: [] };
let writeQueue: Promise<void> = Promise.resolve();

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Default emojis for friends
export const friendEmojis = ['😊', '🌟', '💫', '🎯', '🌸', '🍀', '🦋', '🐱', '☀️', '🎨', '🎵'];

// Get random emoji
export const getRandomEmoji = (): string => {
  return friendEmojis[Math.floor(Math.random() * friendEmojis.length)];
};

const buildActivitiesFromExpenses = (expenses: Expense[]): Activity[] => {
  const activities: Activity[] = [];
  expenses.forEach((expense) => {
    activities.push({
      id: generateId(),
      type: 'created',
      expenseId: expense.id,
      friendId: expense.friendId,
      amount: expense.amount,
      createdAt: expense.createdAt,
    });
    if (expense.paidAt) {
      activities.push({
        id: generateId(),
        type: 'settled',
        expenseId: expense.id,
        friendId: expense.friendId,
        amount: expense.amount,
        createdAt: expense.paidAt,
      });
    }
  });
  return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const normalizeData = (data?: Partial<AppData> | null): AppData => {
  const expenses = Array.isArray(data?.expenses) ? data!.expenses : [];
  return {
    friends: Array.isArray(data?.friends) ? data!.friends : [],
    expenses,
    activities: Array.isArray(data?.activities) ? data!.activities : buildActivitiesFromExpenses(expenses),
  };
};

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const readDataFromIndexedDb = async (): Promise<AppData | null> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(STORE_RECORD_KEY);
    request.onsuccess = () => {
      if (request.result === undefined || request.result === null) {
        resolve(null);
        return;
      }
      resolve(normalizeData(request.result as Partial<AppData>));
    };
    request.onerror = () => reject(request.error);
  });
};

const writeDataToIndexedDb = async (data: AppData): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data, STORE_RECORD_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const persistCache = (data: AppData) => {
  const snapshot = JSON.parse(JSON.stringify(data)) as AppData;
  writeQueue = writeQueue
    .then(() => writeDataToIndexedDb(snapshot))
    .catch((error) => {
      console.error('Error saving data to IndexedDB:', error);
    });
};

export const initStorage = async (): Promise<void> => {
  if (initialized) return;
  try {
    const indexedDbData = await readDataFromIndexedDb();
    if (indexedDbData) {
      dbCache = indexedDbData;
      initialized = true;
      return;
    }

    // One-time migration path from the old localStorage persistence.
    const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyStored) {
      dbCache = normalizeData(JSON.parse(legacyStored) as AppData);
      persistCache(dbCache);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      initialized = true;
      return;
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }

  dbCache = { friends: [], expenses: [], activities: [] };
  initialized = true;
};

// Read data from in-memory cache (primed from IndexedDB at app bootstrap).
export const loadData = (): AppData => {
  return dbCache;
};

// Save data to in-memory cache and persist to IndexedDB.
export const saveData = (data: AppData): void => {
  dbCache = data;
  persistCache(data);
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
  data.activities.push({
    id: generateId(),
    type: 'created',
    expenseId: newExpense.id,
    friendId: newExpense.friendId,
    amount: newExpense.amount,
    createdAt: newExpense.createdAt,
  });
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
    if (expense.isPaid) return;
    const paidSoFar = Math.max(0, expense.paidAmount || 0);
    const remaining = Math.max(0, expense.amount - paidSoFar);
    expense.isPaid = true;
    expense.paidAt = new Date().toISOString();
    expense.paidAmount = expense.amount;
    if (remaining > 0) {
      data.activities.push({
        id: generateId(),
        type: 'settled',
        expenseId: expense.id,
        friendId: expense.friendId,
        amount: remaining,
        createdAt: expense.paidAt,
      });
    }
    saveData(data);
  }
};

export const markAllExpensesPaidForFriend = (friendId: string): void => {
  const data = loadData();
  data.expenses.forEach(expense => {
    if (expense.friendId === friendId && !expense.isPaid) {
      const paidSoFar = Math.max(0, expense.paidAmount || 0);
      const remaining = Math.max(0, expense.amount - paidSoFar);
      expense.isPaid = true;
      expense.paidAt = new Date().toISOString();
      expense.paidAmount = expense.amount;
      if (remaining > 0) {
        data.activities.push({
          id: generateId(),
          type: 'settled',
          expenseId: expense.id,
          friendId: expense.friendId,
          amount: remaining,
          createdAt: expense.paidAt,
        });
      }
    }
  });
  saveData(data);
};

export const getExpenseRemainingAmount = (expense: Expense): number => {
  if (expense.isPaid) return 0;
  const paid = Math.max(0, expense.paidAmount || 0);
  return Math.max(0, expense.amount - paid);
};

export const applyExpensePayment = (expenseId: string, amount: number): void => {
  const data = loadData();
  const expense = data.expenses.find(e => e.id === expenseId);
  if (!expense) return;

  const safeAmount = Math.max(0, amount);
  if (safeAmount <= 0) return;

  const paidSoFar = Math.max(0, expense.paidAmount || 0);
  const remaining = expense.isPaid ? 0 : Math.max(0, expense.amount - paidSoFar);
  if (remaining <= 0) return;

  const applied = Math.min(remaining, safeAmount);
  const newPaid = paidSoFar + applied;
  expense.paidAmount = newPaid;
  const activityTime = new Date().toISOString();
  if (newPaid >= expense.amount) {
    expense.isPaid = true;
    expense.paidAt = activityTime;
    data.activities.push({
      id: generateId(),
      type: 'settled',
      expenseId: expense.id,
      friendId: expense.friendId,
      amount: applied,
      createdAt: activityTime,
    });
  } else {
    data.activities.push({
      id: generateId(),
      type: 'payment',
      expenseId: expense.id,
      friendId: expense.friendId,
      amount: applied,
      createdAt: activityTime,
    });
  }

  saveData(data);
};

// Calculate balances
export const getFriendBalance = (friendId: string): number => {
  const expenses = loadData().expenses;
  return expenses
    .filter(e => e.friendId === friendId)
    .reduce((sum, e) => sum + getExpenseRemainingAmount(e), 0);
};

export const getTotalPending = (): number => {
  const expenses = loadData().expenses;
  return expenses
    .reduce((sum, e) => sum + getExpenseRemainingAmount(e), 0);
};

export const getPendingExpensesForFriend = (friendId: string): Expense[] => {
  return loadData().expenses.filter(e => e.friendId === friendId && getExpenseRemainingAmount(e) > 0);
};

export const getSettledExpensesForFriend = (friendId: string): Expense[] => {
  return loadData().expenses.filter(e => e.friendId === friendId && getExpenseRemainingAmount(e) <= 0);
};

export const getActivities = (limit?: number): Activity[] => {
  const activities = loadData().activities;
  const sorted = activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return limit ? sorted.slice(0, limit) : sorted;
};

export const getActivitiesForFriend = (friendId: string, limit?: number): Activity[] => {
  const activities = loadData().activities.filter(a => a.friendId === friendId);
  const sorted = activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return limit ? sorted.slice(0, limit) : sorted;
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

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
