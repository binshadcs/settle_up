import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, Save, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const nameSchema = z.string().min(1, 'Please enter your name').max(100, 'Name is too long');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const EditProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      setFullName(data?.full_name || '');
      setLoadingProfile(false);
    };

    void fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    const result = nameSchema.safeParse(fullName);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (!user) return;
    setIsSaving(true);
    const { error } = await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        full_name: fullName,
      },
      { onConflict: 'user_id' }
    );

    if (error) toast.error('Failed to update profile');
    else toast.success('Profile updated');
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsChangingPassword(false);
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = fullName?.trim() || user?.user_metadata?.full_name || 'Account User';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-5">
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">Edit Profile</p>
          <div className="w-10" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-5 relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/40"
        >
          <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-primary/10 -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary font-bold flex items-center justify-center text-lg">
              {userInitial}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">{displayName}</h1>
              <p className="text-sm text-muted-foreground">{user?.email || 'No email'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Personal Information
            </h2>
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Identity</span>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="input-field"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-field pl-12 opacity-70 cursor-not-allowed"
                />
              </div>
            </div>
            <button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Security
            </h2>
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Password</span>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="input-field"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="input-field"
              />
            </div>
            <button onClick={handleChangePassword} disabled={isChangingPassword || !newPassword} className="btn-secondary w-full disabled:opacity-60">
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfile;
