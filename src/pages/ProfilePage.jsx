import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Camera, User, MapPin, Globe, Phone, Mail, Calendar,
  Shield, Save, CheckCircle2, Clock, Lock
} from 'lucide-react';
import { profileApi } from '../api/endpoints';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { toast } from '../components/ui/Toaster';
import { timeAgo, formatDate } from '../utils/date';
import { cn } from '../utils/cn';

const profileSchema = z.object({
  display_name: z.string().max(100).optional().or(z.literal('')),
  first_name: z.string().max(100).optional().or(z.literal('')),
  last_name: z.string().max(100).optional().or(z.literal('')),
  username: z.string().min(3).max(50).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  website: z.string().max(200).optional().or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
  phone_number: z.string().min(10).max(15).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  current_password: z.string().min(6),
  new_password: z.string().min(6).max(70),
  confirm_password: z.string().min(6),
}).refine(d => d.new_password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

function AvatarUpload({ profile, onUpload, onDelete, isUploading }) {
  const fileRef = useRef(null);
  const avatarUrl = profile?.avatar_path ? `http://localhost:8001/${profile.avatar_path}` : null;
  const initials = (profile?.display_name || profile?.fullname || profile?.username || 'U')[0].toUpperCase();

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#E5E5E5] bg-[#F2F2F2]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#111111] flex items-center justify-center">
              <span className="text-white text-2xl font-light">{initials}</span>
            </div>
          )}
        </div>

        {/* Upload overlay */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white" />
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }}
        />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs text-[#555555] hover:text-[#111111] transition-colors font-normal"
        >
          Change photo
        </button>
        {avatarUrl && (
          <>
            <span className="text-[#E5E5E5]">·</span>
            <button
              onClick={onDelete}
              className="text-xs text-red-400 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-[#888888] mt-1 font-light">JPG, PNG or WEBP · Max 5MB</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#F7F7F7] last:border-0">
      <div className="w-7 h-7 bg-[#F2F2F2] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-[#888888]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#888888] font-light mb-0.5">{label}</p>
        <p className="text-sm text-[#111111]">{value}</p>
      </div>
    </div>
  );
}

function FormField({ label, error, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-normal text-[#111111] mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-[#888888] mt-1 font-light">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMe,
    staleTime: 60_000,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      display_name: profile.display_name ?? '',
      first_name: profile.first_name ?? '',
      last_name: profile.last_name ?? '',
      username: profile.username ?? '',
      bio: profile.bio ?? '',
      website: profile.website ?? '',
      location: profile.location ?? '',
      phone_number: profile.phone_number ?? '',
    } : {},
  });

  const { register: regPwd, handleSubmit: handlePwdSubmit, formState: { errors: pwdErrors, isSubmitting: isPwdSubmitting }, reset: resetPwd } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const invalidateProfile = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['profile'] });
    refreshUser?.();
  }, [qc, refreshUser]);

  const updateMutation = useMutation({
    mutationFn: profileApi.updateMe,
    onSuccess: (data) => {
      invalidateProfile();
      reset({
        display_name: data.display_name ?? '',
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
        username: data.username ?? '',
        bio: data.bio ?? '',
        website: data.website ?? '',
        location: data.location ?? '',
        phone_number: data.phone_number ?? '',
      });
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to update profile'),
  });

  const handleAvatarUpload = useCallback(async (file) => {
    setIsUploadingAvatar(true);
    try {
      await profileApi.uploadAvatar(file);
      invalidateProfile();
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.detail ?? 'Upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [invalidateProfile]);

  const handleAvatarDelete = useCallback(async () => {
    try {
      await profileApi.deleteAvatar();
      invalidateProfile();
      toast.success('Avatar removed');
    } catch {
      toast.error('Failed to remove avatar');
    }
  }, [invalidateProfile]);

  const handlePasswordChange = async (data) => {
    try {
      await apiClient.post('/users/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success('Password changed');
      resetPwd();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to change password');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const displayName = profile?.display_name || profile?.fullname || profile?.username;
  const joinDate = formatDate(profile?.created_at, 'MMMM d, yyyy');
  const lastLoginText = timeAgo(profile?.last_login);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="animate-slide-up max-w-4xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-[#111111] tracking-tighter mb-1">Account</h1>
        <p className="text-[#888888] text-sm font-light">Manage your profile and preferences</p>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto mb-6">
        <div className="flex gap-1 bg-white border border-[#E5E5E5] rounded-xl p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 min-h-[44px] whitespace-nowrap',
                activeTab === id
                  ? 'bg-[#111111] text-white font-medium'
                  : 'text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column: avatar + info */}
          <div className="space-y-4">
            {/* Avatar card */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <AvatarUpload
                profile={profile}
                onUpload={handleAvatarUpload}
                onDelete={handleAvatarDelete}
                isUploading={isUploadingAvatar}
              />
              <div className="mt-5 text-center">
                <h2 className="text-base font-medium text-[#111111]">{displayName}</h2>
                <p className="text-sm text-[#888888] font-light">@{profile?.username}</p>
                {profile?.bio && (
                  <p className="text-xs text-[#555555] font-light mt-2 leading-relaxed">{profile.bio}</p>
                )}
              </div>
            </motion.div>

            {/* Account info card */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
              <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wider mb-3">Account Info</h3>
              <div className="space-y-0.5">
                <InfoRow icon={Mail} label="Email" value={profile?.email} />
                <InfoRow icon={Calendar} label="Joined" value={joinDate} />
                <InfoRow icon={Clock} label="Last login" value={lastLoginText} />
                <InfoRow icon={CheckCircle2} label="Status" value={profile?.is_active ? 'Active' : 'Inactive'} />
                {profile?.roles?.[0] && (
                  <InfoRow icon={Shield} label="Role" value={profile.roles[0].name} />
                )}
              </div>
            </motion.div>
          </div>

          {/* Right column: edit form */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="card p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#F2F2F2]">
                <div>
                  <h3 className="text-sm font-medium text-[#111111]">Personal Information</h3>
                  <p className="text-xs text-[#888888] font-light mt-0.5">Update your display name and personal details</p>
                </div>
                {isDirty && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => reset()} className="btn-secondary px-3 py-1.5 text-xs">
                      Discard
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5">
                      <Save className="w-3 h-3" />
                      {isSubmitting ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="First name" error={errors.first_name?.message}>
                  <input {...register('first_name')} className="input-base" placeholder="John" />
                </FormField>
                <FormField label="Last name" error={errors.last_name?.message}>
                  <input {...register('last_name')} className="input-base" placeholder="Doe" />
                </FormField>
              </div>

              <FormField label="Display name" error={errors.display_name?.message} hint="How your name appears across the app">
                <input {...register('display_name')} className="input-base" placeholder="John Doe" />
              </FormField>

              <FormField label="Username" error={errors.username?.message} hint="Used for login and @mentions">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888] text-sm">@</span>
                  <input {...register('username')} className="input-base pl-7" placeholder="your_username" />
                </div>
              </FormField>

              <FormField label="Bio" error={errors.bio?.message} hint="Short description about yourself">
                <textarea {...register('bio')} className="input-base resize-none" rows={3} placeholder="Tell us about yourself…" />
              </FormField>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Location" error={errors.location?.message}>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#888888]" />
                    <input {...register('location')} className="input-base pl-9" placeholder="City, Country" />
                  </div>
                </FormField>
                <FormField label="Website" error={errors.website?.message}>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#888888]" />
                    <input {...register('website')} className="input-base pl-9" placeholder="https://yoursite.com" />
                  </div>
                </FormField>
              </div>

              <FormField label="Phone number" error={errors.phone_number?.message}>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#888888]" />
                  <input {...register('phone_number')} className="input-base pl-9" placeholder="+91 98765 43210" />
                </div>
              </FormField>

              {/* Save button at bottom when not dirty (always visible fallback) */}
              {!isDirty && (
                <div className="pt-2 border-t border-[#F2F2F2]">
                  <p className="text-xs text-[#888888] font-light">Make changes above to update your profile</p>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}

      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg">
          <div className="card p-6 space-y-5">
            <div className="pb-4 border-b border-[#F2F2F2]">
              <h3 className="text-sm font-medium text-[#111111] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#888888]" /> Change Password
              </h3>
              <p className="text-xs text-[#888888] font-light mt-0.5">Use a strong password you don&apos;t use elsewhere</p>
            </div>

            <form onSubmit={handlePwdSubmit(handlePasswordChange)} className="space-y-4">
              <FormField label="Current password" error={pwdErrors.current_password?.message}>
                <input {...regPwd('current_password')} type="password" className="input-base" placeholder="••••••••" />
              </FormField>
              <FormField label="New password" error={pwdErrors.new_password?.message}>
                <input {...regPwd('new_password')} type="password" className="input-base" placeholder="••••••••" />
              </FormField>
              <FormField label="Confirm new password" error={pwdErrors.confirm_password?.message}>
                <input {...regPwd('confirm_password')} type="password" className="input-base" placeholder="••••••••" />
              </FormField>
              <button type="submit" disabled={isPwdSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                {isPwdSubmitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          {/* Future integrations placeholder */}
          <div className="card p-6 mt-4">
            <h3 className="text-sm font-medium text-[#111111] mb-1">Connected Accounts</h3>
            <p className="text-xs text-[#888888] font-light mb-4">Social login and integrations coming soon</p>
            <div className="space-y-2">
              {['Google', 'GitHub', 'Discord'].map(name => (
                <div key={name} className="flex items-center justify-between py-2.5 border-b border-[#F7F7F7] last:border-0">
                  <span className="text-sm text-[#555555]">{name}</span>
                  <span className="text-xs text-[#888888] bg-[#F2F2F2] px-2.5 py-1 rounded-full">Coming soon</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
