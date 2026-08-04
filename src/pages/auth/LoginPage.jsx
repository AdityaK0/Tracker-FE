import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../components/ui/Toaster';

const schema = z.object({
  username: z.string().min(3, 'Min 3 characters'),
  password: z.string().min(6, 'Min 6 characters'),
});

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" className="flex-shrink-0" aria-hidden="true" {...props}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  // The backend redirects failed Google logins back to /login?error=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      toast.error('Google sign-in failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      await login(data.username, data.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Login failed');
    }
  };

  // Full browser redirect only — no axios/fetch. The backend owns the entire
  // Google code exchange; the SPA just hands off navigation and waits for
  // the browser to come back to /auth/success.
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8001/auth/google/login';
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white border border-[#E5E5E5] rounded-md p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Brand */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-10 h-10 bg-[#111111] rounded-md flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-base font-semibold text-[#111111]">HabitFlow</h1>
            <p className="text-sm text-[#888888] mt-1">Sign in and build better habits</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#555555] mb-1.5">Username</label>
              <input {...register('username')} className="input-base" placeholder="your_username" autoComplete="username" />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#555555] mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555555] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-1 flex items-center justify-center h-9"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E5E5E5]" />
            <span className="text-[11px] text-[#AAAAAA] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#E5E5E5]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-9 flex items-center justify-center gap-2.5
                       bg-white text-[#3C4043] font-medium text-sm rounded-md
                       border border-[#DADCE0] transition-colors duration-150
                       hover:bg-[#F7F8F8] active:bg-[#F1F3F4]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-center text-sm text-[#888888] mt-5">
            No account?{' '}
            <Link to="/register" className="text-[#111111] font-medium hover:underline underline-offset-2">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
