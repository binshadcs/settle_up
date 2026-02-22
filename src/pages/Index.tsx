import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from '@/components/BottomNav';
import QuickAddDrawer from '@/components/QuickAddDrawer';
import HomeView from '@/components/HomeView';
import FriendsView from '@/components/FriendsView';
import SettleView from '@/components/SettleView';
import HistoryView from '@/components/HistoryView';

type TabType = 'home' | 'friends' | 'settle' | 'history';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="pb-28 pt-6 px-5 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <HomeView refreshKey={refreshKey} />
            </motion.div>
          )}
          
          {activeTab === 'friends' && (
            <motion.div
              key="friends"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <FriendsView refreshKey={refreshKey} onRefresh={triggerRefresh} />
            </motion.div>
          )}
          
          {activeTab === 'settle' && (
            <motion.div
              key="settle"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <SettleView refreshKey={refreshKey} onRefresh={triggerRefresh} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <HistoryView refreshKey={refreshKey} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={() => setIsAddDrawerOpen(true)}
      />

      {/* Quick Add Drawer */}
      <QuickAddDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onExpenseAdded={triggerRefresh}
      />
    </div>
  );
};

export default Index;
