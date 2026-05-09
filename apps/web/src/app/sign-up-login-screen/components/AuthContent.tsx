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
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0D1A35 0%, #0B1120 60%, #0D1A35 100%)',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
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

            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-8 max-w-sm">
                <h2 className="text-3xl font-bold text-foreground leading-tight">
                  The clinical <br />
                  <span className="text-primary">workflow</span> companion
                </h2>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  A secure, offline-first clinical workspace for medical interns. Encrypts your data locally and optionally syncs it securely across your devices.
                </p>
              </div>
            </div>

          {/* Footer */}
          <div className="text-xs text-muted-foreground/50 font-mono">
            ClinicalCWC v2.4.1 · Offline PWA
          </div>
        </div>
      </div>
      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
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