'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, AlertCircle, LogIn, Copy, Check } from 'lucide-react';
import { login } from '@/lib/authService';
import { pullRemoteSnapshot, runSync } from '@/lib/syncService';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const DEMO_CREDENTIALS = {
  email: 'tengbeh.s@amdoglass.edu.gh',
  password: 'CWC@intern2026',
};

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { rememberMe: false },
  });

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const autofillDemo = () => {
    setValue('email', DEMO_CREDENTIALS.email);
    setValue('password', DEMO_CREDENTIALS.password);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      await runSync(result.token);
      await pullRemoteSnapshot(result.token);
      setIsSubmitting(false);
      toast.success('Signed in successfully', {
        description: 'Encrypted cases synced from your workspace.',
      });
      window.location.href = '/';
    } catch (error) {
      setIsSubmitting(false);
      setError('email', {
        message: error instanceof Error ? error.message : 'Invalid credentials',
      });
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
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
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
            <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
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
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={11} />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <input
            {...register('rememberMe')}
            type="checkbox"
            id="rememberMe"
            className="rounded border-border bg-input accent-primary w-4 h-4"
          />
          <label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer">
            Keep me signed in on this device
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn size={15} />
              Sign In
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Box */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-primary">Default Credentials</p>
          <button
            onClick={autofillDemo}
            className="text-xs text-primary/80 hover:text-primary transition-colors font-medium px-2 py-1 rounded hover:bg-primary/10"
          >
            Autofill
          </button>
        </div>
        <div className="space-y-2">
          {[
            { field: 'email', label: 'Email', value: DEMO_CREDENTIALS.email },
            { field: 'password', label: 'Password', value: DEMO_CREDENTIALS.password },
          ].map((c) => (
            <div key={`cred-${c.field}`} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16 shrink-0">{c.label}</span>
              <code className="flex-1 text-xs font-mono text-foreground bg-muted/40 px-2 py-1 rounded truncate">
                {c.value}
              </code>
              <button
                onClick={() => copyToClipboard(c.value, c.field)}
                className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                title={`Copy ${c.label}`}
              >
                {copiedField === c.field ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
