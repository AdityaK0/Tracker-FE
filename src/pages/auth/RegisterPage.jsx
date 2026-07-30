import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../components/ui/Toaster';

const schema = z.object({
  username: z.string().min(3).max(50),
  fullname: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).max(70),
});

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerUser(data.username, data.fullname, data.email, data.password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Registration failed');
    }
  };

  const fields = [
    { name: 'username', label: 'Username', placeholder: 'your_username', type: 'text', autoComplete: 'username' },
    { name: 'fullname', label: 'Full name', placeholder: 'John Doe', type: 'text', autoComplete: 'name' },
    { name: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email', autoComplete: 'email' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white rounded-md p-7">
          {/* Brand */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-10 h-10 bg-[#111111] rounded-md flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-base font-semibold text-[#111111]">HabitFlow</h1>
            <p className="text-sm text-[#888888] mt-1">Create your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {fields.map(({ name, label, placeholder, type, autoComplete }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-[#555555] mb-1.5">{label}</label>
                <input {...register(name)} type={type} className="input-base" placeholder={placeholder} autoComplete={autoComplete} />
                {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>}
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-[#555555] mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  autoComplete="new-password"
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
              {isSubmitting ? 'Creating…' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E5E5E5]" />
            <span className="text-[11px] text-[#AAAAAA] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#E5E5E5]" />
          </div>

          <p className="text-center text-sm text-[#888888]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#111111] font-medium hover:underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
