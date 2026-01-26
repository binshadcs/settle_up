import { Home, Users, CheckCircle, Plus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: 'home' | 'friends' | 'settle' | 'history';
  onTabChange: (tab: 'home' | 'friends' | 'settle' | 'history') => void;
  onAddClick: () => void;
}

const BottomNav = ({ activeTab, onTabChange, onAddClick }: BottomNavProps) => {
  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'friends' as const, icon: Users, label: 'Friends' },
    { id: 'settle' as const, icon: CheckCircle, label: 'Settle' },
    { id: 'history' as const, icon: Clock, label: 'History' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset z-40">
      <div className="max-w-lg mx-auto flex items-center justify-around px-4 py-2 relative">
        {/* FAB Button - positioned in center */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onAddClick}
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-elevated z-10"
          style={{ boxShadow: '0 4px 20px -4px hsl(45 100% 51% / 0.4)' }}
        >
          <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
        </motion.button>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-[56px]"
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
