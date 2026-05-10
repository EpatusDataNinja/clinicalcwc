'use client';

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import AppLogo from '@/components/ui/AppLogo';
import AppImage from '@/components/ui/AppImage';
import { Shield, Wifi, Database, Lock } from 'lucide-react';

export default function AuthContent() {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-background">
      {/* Left Panel — Branding (Hidden purely decorative grid on mobile, order second) */}
      <div
        className="flex lg:w-[45%] xl:w-[42%] flex-col relative overflow-hidden order-2 lg:order-1"
        style={{
          background: 'linear-gradient(135deg, #0D1A35 0%, #0B1120 60%, #0D1A35 100%)',
        }}
      >
        {/* Subtle grid overlay - hidden on mobile to reduce noise */}
        <div
          className="absolute inset-0 opacity-5 hidden lg:block"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-6 py-10 lg:px-10 lg:py-10">
          {/* Logo - Hidden on mobile because it's above the form */}
          <div className="hidden lg:flex items-center gap-3">
            <AppLogo size={36} />
            <div>
              <span className="block font-bold text-lg text-foreground tracking-tight leading-none">
                ClinicalCWC
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                Clinical Workflow Companion
              </span>
            </div>
          </div>

            <div className="flex-1 flex flex-col justify-center relative mt-6 lg:mt-0">
              {/* Hero Image / Banner - Scaled down on mobile */}
              <div className="relative w-full aspect-[2/1] md:aspect-[4/3] rounded-2xl overflow-hidden mb-6 lg:mb-8 border border-border shadow-2xl group">
                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10 transition-opacity duration-500 group-hover:opacity-0" />
                <AppImage 
                  src="/assets/images/login_hero.png" 
                  alt="Clinical Workflow Companion"
                  fill
                  priority
                  className="object-cover transform transition-transform duration-700 group-hover:scale-105"
                  unoptimized={true}
                />
              </div>

              <div className="max-w-sm relative z-20">
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                  The clinical <br />
                  <span className="text-primary">workflow</span> companion
                </h2>
                <p className="text-sm text-muted-foreground mt-3 lg:mt-4 leading-relaxed">
                  A secure, offline-first clinical workspace for medical interns. Encrypts your data locally and optionally syncs it securely across your devices.
                </p>
              </div>
            </div>

          {/* Footer */}
          {/* Footer removed per user request */}
        </div>
      </div>
      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 lg:py-10 overflow-y-auto order-1 lg:order-2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <AppLogo size={32} />
            <span className="font-bold text-lg text-foreground">ClinicalCWC</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {tab === 'login' ? 'Sign in to sync' : 'Create an account'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {tab === 'login' ?'Access your encrypted case data across devices' :'Register to enable cross-device encrypted sync'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex p-1 bg-muted/50 rounded-xl mb-6 border border-border">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === 'login' ?'bg-card text-foreground shadow-card border border-border' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === 'register' ?'bg-card text-foreground shadow-card border border-border' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>

          {tab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
}