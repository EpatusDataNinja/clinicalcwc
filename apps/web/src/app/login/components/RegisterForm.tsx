'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { registerAccount } from '@/lib/authService';
import { runSync } from '@/lib/syncService';
import { useRouter } from 'next/navigation';

interface RegisterFormData {
  fullName: string;
  email: string;
  institution: string;
  role: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Fix 4: Use Next.js router for client-side navigation
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const result = await registerAccount({
        email: data.email,
        password: data.password,
        name: data.fullName,
      });

      // Fix 4: Use router.replace for instant client-side navigation
      toast.success('Account created!', {
        description: `Welcome, ${data.fullName}. Your workspace is ready.`,
      });
      router.replace('/');

      // Fix 5: Fire-and-forget sync — don't block the user
      runSync(result.token).catch((syncErr) => {
        console.warn('Background sync failed:', syncErr);
      });
    } catch (error) {
      setIsSubmitting(false);
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            {...register('fullName', { required: 'Full name is required' })}
            type="text"
            autoComplete="name"
            placeholder="Tengbain Surname"
            className={`w-full px-3 py-2.5 bg-input border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors ${
              errors.fullName ? 'border-red-500/60' : 'border-border'
            }`}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={10} />
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Role <span className="text-red-400">*</span>
          </label>
          <select
            {...register('role', { required: true })}
            className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          >
            <option value="">Select role</option>
            <option value="student">Medical Student</option>
            <option value="intern">Clinical Intern</option>
            <option value="resident">Resident</option>
            <option value="fellow">Fellow</option>
            <option value="attending">Attending Physician</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Institutional Email <span className="text-red-400">*</span>
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
            errors.email ? 'border-red-500/60' : 'border-border'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={10} />
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">Institution</label>
        <input
          {...register('institution')}
          type="text"
          placeholder="e.g. A.M. Doglass College of Medicine"
          className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Passcode <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Used to derive your encryption key — store this securely
        </p>
        <div className="relative">
          <input
            {...register('password', {
              required: 'Passcode is required',
              minLength: { value: 8, message: 'Minimum 8 characters' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                message: 'Must include uppercase, lowercase, number, and symbol',
              },
            })}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••••••"
            className={`w-full px-3 py-2.5 pr-10 bg-input border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors ${
              errors.password ? 'border-red-500/60' : 'border-border'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={10} />
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Confirm Passcode <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword', {
              required: 'Please confirm your passcode',
              validate: (val) => val === password || 'Passcodes do not match',
            })}
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••••••"
            className={`w-full px-3 py-2.5 pr-10 bg-input border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors ${
              errors.confirmPassword ? 'border-red-500/60' : 'border-border'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
          >
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={10} />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2">
        <input
          {...register('agreeTerms', { required: 'You must agree to the terms' })}
          type="checkbox"
          id="agreeTerms"
          className="rounded border-border bg-input accent-primary w-4 h-4 mt-0.5 shrink-0"
        />
        <label
          htmlFor="agreeTerms"
          className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
        >
          I agree to the{' '}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
          . I understand this app stores encrypted patient aliases only.
        </label>
      </div>
      {errors.agreeTerms && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={10} />
          {errors.agreeTerms.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Creating account…
          </>
        ) : (
          <>
            <UserPlus size={15} />
            Create Account
          </>
        )}
      </button>

      <div className="text-center text-xs text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
}
