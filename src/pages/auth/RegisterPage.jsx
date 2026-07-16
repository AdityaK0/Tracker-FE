import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerUser(data.username, data.fullname, data.email, data.password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      const message =
        err?.response?.data?.message ?? 'Registration failed';
      toast.error(message);
    }
  };

  const fields = [
    {
      name: 'username',
      label: 'Username',
      placeholder: 'your_username',
      type: 'text',
    },
    {
      name: 'fullname',
      label: 'Full name',
      placeholder: 'John Doe',
      type: 'text',
    },
    {
      name: 'email',
      label: 'Email',
      placeholder: 'john@example.com',
      type: 'email',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create account</h1>
          <p className="text-[#a1a1aa] text-sm">
            Start tracking your habits today
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map(({ name, label, placeholder, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                {label}
              </label>
              <input
                {...register(name)}
                type={type}
                className="input-base"
                placeholder={placeholder}
              />
              {errors[name] && (
                <p className="text-red-400 text-xs mt-1">
                  {errors[name]?.message}
                </p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="input-base pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-2"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#52525b] mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
