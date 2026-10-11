import React, { useState } from 'react';
import {
  registerWithEmailPassword,
  loginWithEmailPassword,
  signInWithGoogle,
  getFriendlyAuthErrorMessage,
  FriendlyAuthError,
} from '../services/firebase';
import {
  X,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  LogIn,
  UserPlus,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
  initialMode?: 'login' | 'register' | 'verify';
  initialVerifyEmail?: string;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
    <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  initialVerifyEmail = '',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState(initialVerifyEmail);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FriendlyAuthError | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError({
        title: 'Missing Information',
        solution: 'Please enter both an email address and password.',
      });
      return;
    }

    if (password.length < 6) {
      setError({
        title: 'Password Too Short',
        solution: 'Password must be at least 6 characters.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setError({
        title: 'Passwords Do Not Match',
        solution: 'Please ensure both passwords match.',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithEmailPassword(email, password);
      setUnverifiedEmail(res.email);
      setMode('verify');
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError({
        title: 'Missing Information',
        solution: 'Please enter both your email and password.',
      });
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithEmailPassword(email, password);
      onSuccess(user.email || email);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/unverified-email') {
        // Block access and switch directly to the required verification screen
        setUnverifiedEmail(err.userEmail || email.trim());
        setMode('verify');
      } else {
        setError(getFriendlyAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSuccess(user.email || 'User');
        onClose();
      }
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderErrorBanner = () => {
    if (!error) return null;

    if (error.isUnauthorizedDomain) {
      return (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex flex-col gap-2.5 animate-fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <div className="font-bold text-white text-xs">{error.title}</div>
              <div className="text-[11px] text-rose-200/90 mt-0.5">{error.solution}</div>
            </div>
          </div>

          {/* Domain copy box */}
          {error.domain && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-rose-500/30 font-mono text-[11px] text-rose-100">
              <span className="truncate select-all text-xs font-semibold">{error.domain}</span>
              <button
                type="button"
                onClick={() => {
                  if (error.domain) {
                    navigator.clipboard.writeText(error.domain);
                    setCopiedDomain(true);
                    setTimeout(() => setCopiedDomain(false), 2000);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-pink-500/30 hover:bg-pink-500/50 text-white text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedDomain ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step by step guide */}
          <div className="text-[11px] text-slate-300 space-y-1 bg-black/25 p-2.5 rounded-xl border border-white/5">
            <div className="font-bold text-white text-[10px] uppercase tracking-wider">How to authorize this domain:</div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-300">
              <li>In your Firebase Console, open <b>Authentication</b></li>
              <li>Click the <b>Settings</b> tab (top tabs)</li>
              <li>Click <b>Authorized domains</b> → click <b>Add domain</b></li>
              <li>Paste the domain above and click <b>Add</b></li>
            </ol>
          </div>

          {error.firebaseConsoleUrl && (
            <a
              href={error.firebaseConsoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Open Firebase Authorized Domains Settings</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      );
    }

    return (
      <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold">{error.title}</div>
          <div className="opacity-90 mt-0.5">{error.solution}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-md bg-[#181527] light:bg-white border border-[#2e2946] light:border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 flex flex-col gap-5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#221e35] light:bg-slate-100 hover:bg-[#2e2946] text-slate-300 light:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* VERIFICATION SCREEN */}
        {mode === 'verify' && (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="w-16 h-16 rounded-3xl bg-pink-500/15 text-[#ff6b9d] border border-pink-500/30 flex items-center justify-center shadow-lg shadow-pink-500/10 animate-bounce-subtle">
              <Mail className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white light:text-slate-900 tracking-tight">
                Verify Your Email
              </h2>
              {/* Exact user requested message:
                  "We have sent you a verification email to [user email]. Please verify it and log in." */}
              <p className="text-sm text-slate-300 light:text-slate-600 mt-2.5 leading-relaxed">
                We have sent you a verification email to{' '}
                <span className="font-bold text-[#ff6b9d] break-all">
                  {unverifiedEmail || 'your email'}
                </span>
                . Please verify it and log in.
              </p>
            </div>

            <div className="w-full p-3.5 rounded-2xl bg-[#221e35]/70 light:bg-slate-50 border border-[#2e2946] light:border-slate-200 text-xs text-slate-400 text-left flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Click the confirmation link inside the email from Firebase, then return here and click <b>Login</b>. Check your spam/junk folder if you don&apos;t see it.
              </span>
            </div>

            {/* Include a Login button on the verification screen */}
            <div className="w-full flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setEmail(unverifiedEmail);
                  setMode('login');
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#e0457b] via-[#ff6b9d] to-[#8b5cf6] hover:brightness-110 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-xs text-slate-400 hover:text-white cursor-pointer py-1"
              >
                Need to change email? Register again
              </button>
            </div>
          </div>
        )}

        {/* LOGIN SCREEN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/15 text-[#ff6b9d] border border-pink-500/30 text-[11px] font-bold uppercase tracking-wider mb-2">
                <LogIn className="w-3 h-3" />
                <span>Account Login</span>
              </div>
              <h2 className="text-2xl font-black text-white light:text-slate-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
                Log in to access your anime watchlist tracker.
              </p>
            </div>

            {/* Error Message */}
            {renderErrorBanner()}

            {/* Email input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#221e35] light:bg-slate-50 border border-[#2e2946] light:border-slate-300 rounded-xl text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#ff6b9d]"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#221e35] light:bg-slate-50 border border-[#2e2946] light:border-slate-300 rounded-xl text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#ff6b9d]"
                />
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Logging In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[#2e2946] light:bg-slate-200" />
              <span className="text-[10px] text-slate-500 uppercase font-bold">or</span>
              <div className="flex-1 h-px bg-[#2e2946] light:bg-slate-200" />
            </div>

            {/* Google option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#221e35] light:bg-slate-50 hover:bg-[#2e2946] border border-[#2e2946] light:border-slate-300 text-xs font-semibold text-slate-200 light:text-slate-800 flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            {/* Switch to Register */}
            <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#2e2946]/50">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('register');
                }}
                className="text-[#ff6b9d] font-bold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* REGISTER SCREEN */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/15 text-[#ff6b9d] border border-pink-500/30 text-[11px] font-bold uppercase tracking-wider mb-2">
                <UserPlus className="w-3 h-3" />
                <span>Create Account</span>
              </div>
              <h2 className="text-2xl font-black text-white light:text-slate-900 tracking-tight">
                Create an Account
              </h2>
              <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
                We will email you a verification link before you can log in.
              </p>
            </div>

            {/* Error Message */}
            {renderErrorBanner()}

            {/* Email input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#221e35] light:bg-slate-50 border border-[#2e2946] light:border-slate-300 rounded-xl text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#ff6b9d]"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#221e35] light:bg-slate-50 border border-[#2e2946] light:border-slate-300 rounded-xl text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#ff6b9d]"
                />
              </div>
            </div>

            {/* Confirm Password input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#221e35] light:bg-slate-50 border border-[#2e2946] light:border-slate-300 rounded-xl text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#ff6b9d]"
                />
              </div>
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#e0457b] to-[#ff6b9d] hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending Verification Email...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Send Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Login */}
            <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#2e2946]/50">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-[#ff6b9d] font-bold hover:underline cursor-pointer"
              >
                Log in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
