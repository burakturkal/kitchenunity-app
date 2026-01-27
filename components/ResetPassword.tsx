
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Building2 } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || !confirm) {
      setError('Please fill out both fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password updated! You can now log in.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
      <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-2 duration-700">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-2">
          <Building2 className="text-white" size={36} />
        </div>
        <span className="font-black text-2xl tracking-tight text-slate-900 leading-none">Kitchen<span className="text-blue-600">Unity</span></span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Password Recovery</span>
      </div>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <h2 className="text-2xl font-black mb-2 text-blue-700 text-center">Reset Your Password</h2>
        <p className="text-slate-500 text-center mb-6">For your security, please choose a strong password you haven't used before.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700">Confirm Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Re-enter new password"
            />
          </div>
          {error && <div className="text-red-500 text-sm text-center font-semibold animate-pulse">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center font-semibold animate-in fade-in duration-500">{success}</div>}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-lg shadow-md transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} KitchenUnity. All rights reserved.</div>
      </div>
    </div>
  );
};

export default ResetPassword;
