'use client';

import React, { useState } from 'react';
import { useCaseStore } from '@/lib/store';
import { updateProfile, logout } from '@/lib/authService';
import { User, Mail, Lock, LogOut, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const userName = useCaseStore((state) => state.userName);
  const userEmail = useCaseStore((state) => state.userEmail);
  const authToken = useCaseStore((state) => state.authToken);

  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  if (!authToken) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
        <User size={48} className="text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Not Signed In</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          You are currently using ClinicalCWC in offline-only mode. Sign in to sync your data and manage your profile.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        email,
        ...(currentPassword && newPassword ? { currentPassword, newPassword } : {})
      });
      toast.success('Profile updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      
      // Immediate redirect for snappier feel
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    router.push('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      {/* Profile Info Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User size={28} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{userName || 'Clinical Intern'}</h2>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <User size={14} /> Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                placeholder="Dr. John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                placeholder="you@institution.edu"
              />
            </div>

            <div className="pt-4 border-t border-border mt-6">
              <h3 className="text-sm font-semibold mb-4 text-foreground">Change Password</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Lock size={14} /> Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Lock size={14} /> New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Leave blank if you do not wish to change your password.</p>
            </div>

            <div className="pt-6 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Account Actions */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-red-400 mb-2">Account Actions</h3>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Signing out will pause synchronization, but your locally encrypted cases will remain on this device.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all active:scale-95"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
  );
}
