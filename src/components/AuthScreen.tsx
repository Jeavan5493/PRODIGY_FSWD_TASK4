import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, User, Sparkles, MessageSquare, ArrowRight, Check, ShieldAlert } from "lucide-react";
import { User as ChatUser } from "../types";
import { PRESET_AVATARS } from "../utils";

interface AuthScreenProps {
  onAuthSuccess: (user: ChatUser) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please provide both username and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const endpoint = isRegister ? "/api/register" : "/api/login";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          avatarUrl: isRegister ? avatarUrl : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 499) {
          setErrorMsg("Username is already taken. Try logging in or use another seed.");
        } else {
          setErrorMsg(data.error || "Authentication failed. Check your password.");
        }
        setLoading(false);
        return;
      }

      onAuthSuccess(data);
    } catch (err) {
      setErrorMsg("Could not connect to the authentication server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-slate-900 via-slate-950 to-black px-4 py-12 font-sans text-slate-100 selection:bg-teal-500 selection:text-black">
      
      {/* Background visual graphics */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] left-[10%] h-[350px] w-[350px] rounded-full bg-teal-500/10 blur-[100px]" />
        <div className="absolute right-[10%] bottom-[20%] h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-xl"
      >
        <div className="p-8 sm:p-10">
          
          {/* Main Icon & Title */}
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white font-sans">
              {isRegister ? "Join Real-Time Chat" : "Welcome Back"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {isRegister 
                ? "Register a profile to experience live instant messaging" 
                : "Sign in to resume rooms and private chats"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <p>{errorMsg}</p>
              </motion.div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Satoshi"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/40 py-2.5 pr-4 pl-10 text-sm text-slate-100 placeholder-slate-500 transition focus:border-teal-500 focus:bg-slate-800/80 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/40 py-2.5 pr-4 pl-10 text-sm text-slate-100 placeholder-slate-500 transition focus:border-teal-500 focus:bg-slate-800/80 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Avatar Selection (Only during Register) */}
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden space-y-3"
              >
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Avatar Style
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_AVATARS.map((url) => {
                    const isSelected = avatarUrl === url;
                    return (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`relative aspect-square overflow-hidden rounded-xl border bg-slate-800/50 p-1.5 transition-all hover:scale-105 active:scale-95 ${
                          isSelected ? "border-teal-400 ring-2 ring-teal-400/30 bg-teal-500/10" : "border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        <img
                          src={url}
                          alt="Avatar preset Option"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-contain"
                        />
                        {isSelected && (
                          <div className="absolute right-1 bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-400 text-slate-950">
                            <Check className="h-2.5 w-2.5 stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                  <span>Choose from our premium vector character sets.</span>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-500 to-emerald-500 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-500/10 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <span>{isRegister ? "Create Free Account" : "Access Live Chat"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Screen Option */}
          <div className="mt-6 border-t border-slate-800/80 pt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg("");
              }}
              className="text-xs text-teal-400 transition hover:text-teal-300 hover:underline"
            >
              {isRegister 
                ? "Already have an account? Sign In" 
                : "Need an account? Sign Up instantly"}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
