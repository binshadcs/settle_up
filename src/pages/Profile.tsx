import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Cloud, CloudDownload, CloudUpload, Database, FileText, HardDrive, Lock, LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getCloudSyncDiagnostics, isCloudSyncEnabled, loadData, pullCloudToLocal, syncNowToCloud } from '@/lib/storage';
import { toast } from 'sonner';
import UserAvatar from '@/components/UserAvatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Profile = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fullName, setFullName] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
  const [localStats, setLocalStats] = useState({ friends: 0, expenses: 0, activities: 0 });
  const [syncingNow, setSyncingNow] = useState(false);
  const [pullingCloud, setPullingCloud] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  useEffect(() => {
    const refresh = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      setFullName(data?.full_name || '');
      setSyncEnabled(isCloudSyncEnabled());
      setSyncError(getCloudSyncDiagnostics().lastError);

      const local = loadData();
      setLocalStats({
        friends: local.friends.length,
        expenses: local.expenses.length,
        activities: local.activities.length,
      });

      const { data: cloudMeta } = await supabase
        .from('user_app_data')
        .select('updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      setCloudUpdatedAt(cloudMeta?.updated_at || null);
      setLoadingProfile(false);
    };

    void refresh();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSyncNow = async () => {
    try {
      setSyncingNow(true);
      await syncNowToCloud();
      setSyncError(getCloudSyncDiagnostics().lastError);
      toast.success('Synced to cloud');
    } catch {
      setSyncError(getCloudSyncDiagnostics().lastError);
      toast.error('Cloud sync failed');
    } finally {
      setSyncingNow(false);
    }
  };

  const handlePullCloud = async () => {
    try {
      setPullingCloud(true);
      const hasCloudData = await pullCloudToLocal();
      if (!hasCloudData) {
        toast.message('No cloud data found');
      } else {
        const local = loadData();
        setLocalStats({
          friends: local.friends.length,
          expenses: local.expenses.length,
          activities: local.activities.length,
        });
        setSyncError(getCloudSyncDiagnostics().lastError);
        toast.success('Local data updated from cloud');
      }
    } catch {
      setSyncError(getCloudSyncDiagnostics().lastError);
      toast.error('Failed to pull cloud data');
    } finally {
      setPullingCloud(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = fullName?.trim() || user?.user_metadata?.full_name || 'Account User';
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-5">
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">Profile</p>
          <div className="w-10" />
        </div>

        <div className="card-elevated p-5 relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/45">
          <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-primary/10 -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar seed={user?.id ?? user?.email} size="md" />
              <div>
                <h1 className="text-xl font-bold text-foreground leading-tight">{displayName}</h1>
                <p className="text-sm text-muted-foreground">{user?.email || 'No email'}</p>
              </div>
            </div>
            <div
              className={`w-9 h-9 rounded-full border flex items-center justify-center ${syncEnabled ? 'text-success bg-success/10 border-success/20' : 'text-warning bg-warning/10 border-warning/20'}`}
              title={syncEnabled ? 'Cloud + Local Sync' : 'Local Only'}
              aria-label={syncEnabled ? 'Cloud + Local Sync' : 'Local Only'}
            >
              {syncEnabled ? <Cloud className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
            </div>
          </div>
        </div>

        <div className="card-elevated p-3 space-y-1">
          <MenuItem icon={User} label="Edit Profile" onClick={() => navigate('/profile/edit')} />
          <MenuItem icon={Lock} label="Change Password" onClick={() => navigate('/profile/password')} />
          <MenuItem icon={FileText} label="Terms & Conditions" onClick={() => navigate('/profile/terms')} />
          <MenuItem icon={Shield} label="Privacy Policy" onClick={() => navigate('/profile/privacy')} />
        </div>

        <div className="card-elevated p-4 sm:p-5 space-y-4 relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/35">
          <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-primary/10" />
          <div className="absolute -left-14 -bottom-14 w-32 h-32 rounded-full bg-success/10" />

          <div className="relative rounded-2xl border border-border/60 bg-card/80 px-3.5 py-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Cloud className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground leading-tight">Cloud Sync</p>
                <p className="text-xs text-muted-foreground">Auto backup for signed-in account</p>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
              syncEnabled ? 'text-success bg-success/10 border-success/20' : 'text-warning bg-warning/10 border-warning/20'
            }`}>
              {syncEnabled ? 'Connected' : 'Local Only'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border/60 bg-secondary/35 px-2.5 py-2 text-center">
              <p className="text-[11px] text-muted-foreground">Friends</p>
              <p className="text-sm font-semibold text-foreground">{localStats.friends}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/35 px-2.5 py-2 text-center">
              <p className="text-[11px] text-muted-foreground">Expenses</p>
              <p className="text-sm font-semibold text-foreground">{localStats.expenses}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/35 px-2.5 py-2 text-center">
              <p className="text-[11px] text-muted-foreground">Activity</p>
              <p className="text-sm font-semibold text-foreground">{localStats.activities}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-secondary/70 flex items-center justify-center">
                <Database className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Last Cloud Update</p>
                <p className="text-xs font-medium text-foreground">
                  {cloudUpdatedAt ? new Date(cloudUpdatedAt).toLocaleString('en-IN') : 'Not available'}
                </p>
              </div>
            </div>
          </div>

          {syncError && (
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {syncError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSyncNow}
              disabled={!syncEnabled || syncingNow}
              className="h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <CloudUpload className="w-4 h-4" />
              {syncingNow ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={handlePullCloud}
              disabled={!syncEnabled || pullingCloud}
              className="h-11 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <CloudDownload className="w-4 h-4" />
              {pullingCloud ? 'Pulling...' : 'Pull Cloud'}
            </button>
          </div>
        </div>

        <div className="card-elevated p-2.5">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full h-12 rounded-xl px-3 flex items-center justify-between bg-card hover:bg-destructive/5 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Sign Out</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Secure Exit</span>
              </motion.button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[92vw] max-w-sm rounded-2xl border-border/70 bg-card/95 backdrop-blur-xl p-4 sm:p-5 shadow-[0_18px_40px_-20px_hsl(30_20%_15%_/_0.45)]">
              <AlertDialogHeader className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <AlertDialogTitle className="text-base font-semibold text-foreground">
                  Sign out from this device?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  You can sign back in anytime. Your local data will stay on this device.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-2 gap-2 sm:gap-2">
                <AlertDialogCancel className="h-11 rounded-xl border-border/70 bg-secondary/40 text-foreground">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSignOut}
                  className="h-11 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sign Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof User;
  label: string;
  onClick: () => void;
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="w-4 h-4 text-foreground" />
        </div>
        <span className="font-medium text-foreground text-sm">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </motion.button>
  );
};

export default Profile;
