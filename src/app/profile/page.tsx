// fromtend/src/app/profile/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabaseBrowserClient';
import { motion, AnimatePresence } from 'framer-motion';

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  address: string;
  payment_methods?: any[];
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && user.id) {
      setLoading(true);
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        });
    }
  }, [user, authLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile!, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user?.id,
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        phone_number: profile?.phone_number ?? "",
        date_of_birth: profile?.date_of_birth ?? null,
        address: profile?.address ?? "",
      });

    setSaving(false);
    if (!error) {
      setMessage('Profile updated!');
      // Refetch profile to get fresh data
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      setProfile(data);
    } else {
      setMessage('Error saving profile.');
    }
  };

  if (authLoading || loading)
    return (
      <motion.div
        className="p-10 text-lg text-blue-800 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Loading profile...
      </motion.div>
    );
  if (!user)
    return (
      <motion.div
        className="p-10 text-lg text-red-600 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Not authorized. Please log in.
      </motion.div>
    );

  return (
    <motion.div
      className="max-w-lg mx-auto p-8 bg-white/95 shadow-2xl rounded-2xl mt-14 border border-blue-100"
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring' }}
    >
      <motion.h1
        className="text-3xl font-extrabold text-blue-800 mb-8 text-center"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        My Profile
      </motion.h1>
      <motion.form
        onSubmit={handleSave}
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <motion.div className="flex flex-col gap-1">
          <label className="block text-blue-900 font-semibold mb-1">Email (read-only)</label>
          <input
            type="email"
            name="email"
            value={user?.email || ''}
            disabled
            className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 bg-blue-50 text-gray-700 opacity-90 cursor-not-allowed"
          />
        </motion.div>
        <motion.div className="flex flex-col gap-1">
          <label className="block text-blue-900 font-semibold mb-1">First Name</label>
          <motion.input
            type="text"
            name="first_name"
            value={profile?.first_name || ''}
            onChange={handleChange}
            className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 transition"
            required
            whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
          />
        </motion.div>
        <motion.div className="flex flex-col gap-1">
          <label className="block text-blue-900 font-semibold mb-1">Last Name</label>
          <motion.input
            type="text"
            name="last_name"
            value={profile?.last_name || ''}
            onChange={handleChange}
            className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 transition"
            required
            whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
          />
        </motion.div>
        <motion.div className="flex flex-col gap-1">
          <label className="block text-blue-900 font-semibold mb-1">Phone Number</label>
          <motion.input
            type="tel"
            name="phone_number"
            value={profile?.phone_number || ''}
            onChange={handleChange}
            className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 transition"
            required
            whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
          />
        </motion.div>
        <motion.div className="flex flex-col gap-1">
          <label className="block text-blue-900 font-semibold mb-1">Date of Birth</label>
          <motion.input
            type="date"
            name="date_of_birth"
            value={profile?.date_of_birth || ''}
            onChange={handleChange}
            className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 transition"
            whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
          />
        </motion.div>
        <motion.div className="flex flex-col gap-1">
          <label className="block text-blue-900 font-semibold mb-1">Address</label>
          <motion.textarea
            name="address"
            value={profile?.address || ''}
            rows={3}
            onChange={handleChange}
            className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 transition"
            whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
          />
        </motion.div>
        <motion.button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-500 hover:to-blue-700 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg mt-2 transition-all"
          disabled={saving}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </motion.button>
        <AnimatePresence>
          {message && (
            <motion.div
              className={`mt-4 text-center font-semibold ${
                message.includes('Error') ? 'text-red-600' : 'text-green-700'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      {/* --- Space below the form to show the updated user profile --- */}
      <div className="mt-12">
        <motion.h2
          className="text-xl font-bold text-blue-800 mb-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          Your Updated Profile
        </motion.h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-6 shadow text-blue-900">
          <div className="flex flex-col gap-2">
            <div>
              <span className="font-semibold">Email:</span> {user?.email}
            </div>
            <div>
              <span className="font-semibold">First Name:</span> {profile?.first_name || <span className="text-blue-400">-</span>}
            </div>
            <div>
              <span className="font-semibold">Last Name:</span> {profile?.last_name || <span className="text-blue-400">-</span>}
            </div>
            <div>
              <span className="font-semibold">Phone Number:</span> {profile?.phone_number || <span className="text-blue-400">-</span>}
            </div>
            <div>
              <span className="font-semibold">Date of Birth:</span> {profile?.date_of_birth || <span className="text-blue-400">-</span>}
            </div>
            <div>
              <span className="font-semibold">Address:</span> {profile?.address || <span className="text-blue-400">-</span>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}