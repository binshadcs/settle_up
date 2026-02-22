import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const ChangePassword = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  const handleChangePassword = async () => {
    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message || 'Failed to change password');
    else {
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
      navigate('/profile');
    }
    setIsChangingPassword(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-6">
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">Security</p>
          <div className="w-10" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-5 relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/55"
        >
          <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-primary/15 -translate-y-1/2 translate-x-1/2" />
          <div className="relative space-y-1">
            <h1 className="text-xl font-bold text-foreground leading-tight">Change Password</h1>
            <p className="text-sm text-muted-foreground">Use a strong password to keep your account secure.</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                Password Update
              </h2>
              <p className="text-xs text-muted-foreground mt-1">This change applies to your current account sign-in.</p>
            </div>
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Protected</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="input-field pl-12"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="input-field pl-12"
                />
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="btn-primary w-full h-11 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isChangingPassword ? (
                <span>Updating...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChangePassword;
