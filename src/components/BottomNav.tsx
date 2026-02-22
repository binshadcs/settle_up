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
  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-lg mx-auto px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] sm:pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)]">
        <div className="relative pointer-events-auto rounded-[22px] sm:rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-[0_14px_34px_-18px_hsl(30_20%_15%_/_0.34)] px-2.5 sm:px-3 pt-2.5 sm:pt-3 pb-2 sm:pb-2.5">
          <div className="absolute left-1/2 -translate-x-1/2 -top-7 sm:-top-8 z-20">
            <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-xl scale-90" />
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onAddClick}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center"
              style={{ boxShadow: '0 12px 26px -10px hsl(45 100% 51% / 0.65)' }}
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" strokeWidth={2.6} />
            </motion.button>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-center gap-0.5 sm:gap-1">
              {leftItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex min-w-[62px] sm:min-w-[72px] flex-col items-center gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 transition-all duration-200 ${
                      isActive ? 'bg-primary/10' : 'hover:bg-muted/70'
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] sm:w-5 sm:h-5 transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span
                      className={`text-[9px] sm:text-[10px] font-medium transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="w-[72px] sm:w-[84px]" aria-hidden />

            <div className="flex items-center gap-0.5 sm:gap-1">
              {rightItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex min-w-[62px] sm:min-w-[72px] flex-col items-center gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 transition-all duration-200 ${
                      isActive ? 'bg-primary/10' : 'hover:bg-muted/70'
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] sm:w-5 sm:h-5 transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span
                      className={`text-[9px] sm:text-[10px] font-medium transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
