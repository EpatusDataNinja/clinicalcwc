'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { login } from '@/lib/authService';
import { pullRemoteSnapshot, runSync } from '@/lib/syncService';
import { useRouter } from 'next/navigation';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);

      // Fix 4: Use router.replace for instant client-side navigation
      // Fix 5: Navigate immediately — sync in background
      toast.success('Signed in successfully', {
        description: 'Syncing your encrypted cases...',
      });
      router.replace('/');

      // Fix 5: Fire-and-forget sync — don't block the user
      Promise.all([
        runSync(result.token),
        pullRemoteSnapshot(result.token),
      ]).then(([pushResult, pullResult]) => {
        if (pushResult.status === 'error' || pullResult.status === 'error') {
          toast.info('Sync pending', {
            description: 'Your data will sync when the connection is stable.',
          });
        } else {
          toast.success('Sync complete', {
            description: 'All encrypted cases are up to date.',
          });
        }
      }).catch((syncErr) => {
        console.warn('Background sync failed:', syncErr);
        toast.info('Sync pending', {
          description: 'Your data will sync when the connection is stable.',
        });
      });
    } catch (error) {
      setIsSubmitting(false);
      const msg = error instanceof Error ? error.message : 'Invalid credentials';
      setError('email', { message: msg });
      
      if (msg.toLowerCase().includes('invalid')) {
        toast.error('Login Failed', {
          description: 'If you just joined, you must click the "Register" tab to create your account first.',
          duration: 6000,
        });
      }
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
            type="email"
            autoComplete="email"
            placeholder="you@institution.edu"
            className={`w-full px-3 py-2.5 bg-input border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors ${
              errors.email ? 'border-red-500/60 focus:ring-red-500/60' : 'border-border'
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-medium">
              <AlertCircle size={11} />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-foreground">
              Password <span className="text-red-400">*</span>
            </label>
            <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              className={`w-full px-3 py-2.5 pr-10 bg-input border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors ${
                errors.password ? 'border-red-500/60 focus:ring-red-500/60' : 'border-border'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-medium">
              <AlertCircle size={11} />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2 py-1">
          <input
            {...register('rememberMe')}
            type="checkbox"
            id="rememberMe"
            className="rounded border-border bg-input accent-primary w-4 h-4 cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer select-none">
            Keep me signed in on this device
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              <LogIn size={16} />
              Sign In
            </>
          )}
        </button>
      </form>
    </div>
  );
}
