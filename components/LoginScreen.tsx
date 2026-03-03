"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, Mail, Loader2 } from "lucide-react";

export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 🚀 AUTO-TRIGGER LOGIC: Fires when password reaches a certain length or matches
  useEffect(() => {
    // Basic pre-check before hitting API to save resources
    if (email.toLowerCase().endsWith("@ve-lyra.com") && password === "VeLyraTax2026!" && password.length >= 8) {
      handleLogin();
    }
  }, [password, email]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError("");

    try {
      const res = await fetch("https://laksss-ai-legal-suite.hf.space/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === "success") {
        // Play success animation for 500ms before switching
        setTimeout(() => {
          localStorage.setItem("user_session", data.user);
          onLoginSuccess(data.user);
        }, 600);
      } else {
        setIsLoggingIn(false);
        if (password.length >= 8) setError(data.detail || "Invalid Credentials");
      }
    } catch (err) {
      setIsLoggingIn(false);
      setError("Server connection failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] p-12 shadow-2xl w-full max-w-md z-10 border border-white/10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            animate={isLoggingIn ? { scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`p-5 rounded-3xl text-white mb-6 shadow-xl transition-colors duration-500 ${isLoggingIn ? 'bg-emerald-500' : 'bg-indigo-600'}`}
          >
            <ShieldCheck size={48} />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Professional Tax Suite</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Internal Statutory Platform</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Email ID</label>
            <div className="relative">
              <Mail className="absolute left-5 top-4 text-slate-300" size={18} />
              <input 
                type="email" 
                placeholder="name@ve-lyra.com" 
                value={email} 
                disabled={isLoggingIn}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-14 py-4 outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-5 top-4 text-slate-300" size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                disabled={isLoggingIn}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-14 py-4 outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="text-rose-500 text-[10px] font-black text-center uppercase tracking-wider"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="pt-4">
            <button 
              onClick={handleLogin} 
              disabled={isLoggingIn || !email || !password}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
                isLoggingIn 
                ? 'bg-emerald-500 text-white cursor-wait' 
                : 'bg-slate-900 text-white hover:bg-black active:scale-95'
              }`}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                "Initialize Session"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}