import React, { useState, useEffect } from 'react';
import { Code, Copy, CheckCircle, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, RefreshCw } from 'lucide-react';
import { EmbedToken, CabinetStore } from '../types';
import { db } from '../services/supabase';

const API_BASE = 'https://api.cabopspro.com';

interface EmbedCodeGeneratorProps {
  stores: CabinetStore[];
}

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
    {children}
  </label>
);

const EmbedCodeGenerator: React.FC<EmbedCodeGeneratorProps> = ({ stores }) => {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || '');
  const [tokens, setTokens] = useState<EmbedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<EmbedToken | null>(null);

  useEffect(() => {
    if (!selectedStoreId) return;
    loadTokens(selectedStoreId);
  }, [selectedStoreId]);

  async function loadTokens(storeId: string) {
    setLoading(true);
    setError(null);
    try {
      const list = await db.embedTokens.listByStore(storeId);
      setTokens(list as EmbedToken[]);
    } catch (err: any) {
      setError('Could not load embed tokens. Make sure the embed_tokens table exists in Supabase.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedStoreId) return;
    setGenerating(true);
    setError(null);
    try {
      const token = await db.embedTokens.create(selectedStoreId, newLabel || 'Default Form');
      setTokens(prev => [token as EmbedToken, ...prev]);
      setNewLabel('');
      setPreviewToken(token as EmbedToken);
    } catch (err: any) {
      setError('Failed to generate token. ' + (err?.message || ''));
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(token: EmbedToken) {
    try {
      await db.embedTokens.revoke(token.id);
      setTokens(prev => prev.map(t => t.id === token.id ? { ...t, active: false } : t));
      if (previewToken?.id === token.id) setPreviewToken(null);
    } catch (err: any) {
      setError('Failed to revoke token.');
    }
  }

  async function handleDelete(token: EmbedToken) {
    if (!confirm(`Delete embed token "${token.label}"? This will permanently break any forms using it.`)) return;
    try {
      await db.embedTokens.delete(token.id);
      setTokens(prev => prev.filter(t => t.id !== token.id));
      if (previewToken?.id === token.id) setPreviewToken(null);
    } catch (err: any) {
      setError('Failed to delete token.');
    }
  }

  function embedCode(token: string) {
    return `<script src="${API_BASE}/embed/widget.js?token=${token}"></script>`;
  }

  function copyEmbed(token: EmbedToken) {
    navigator.clipboard.writeText(embedCode(token.token));
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  return (
    <div className="space-y-8">
      {/* Store selector */}
      <div>
        <Label>Select Store to Generate Embed For</Label>
        <select
          value={selectedStoreId}
          onChange={e => setSelectedStoreId(e.target.value)}
          className="w-full max-w-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none"
        >
          {stores.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Generate new token */}
      <div className="p-6 bg-blue-50/60 border border-blue-100 rounded-3xl space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-700">Generate New Embed Code</h4>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={`Label (e.g. "Homepage Form")`}
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedStoreId}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-60 transition-all"
          >
            {generating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
            Generate
          </button>
        </div>
        <p className="text-[10px] text-blue-600 font-bold">
          Each code is unique to <strong>{selectedStore?.name || 'this store'}</strong>. Leads submitted go directly to their CRM — no third-party tools needed.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-bold">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Preview embed code */}
      {previewToken && (
        <div className="p-6 bg-slate-900 rounded-3xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <CheckCircle size={14} /> New embed code ready — "{previewToken.label}"
            </span>
            <button onClick={() => setPreviewToken(null)} className="text-slate-500 hover:text-white text-xs">✕ Dismiss</button>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 font-mono text-xs text-blue-300 break-all">
            {embedCode(previewToken.token)}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => copyEmbed(previewToken)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
            >
              {copiedId === previewToken.id ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copiedId === previewToken.id ? 'Copied!' : 'Copy Code'}
            </button>
            <p className="text-[10px] text-slate-400 font-bold self-center">Paste this anywhere on the website — inside a page, post, or popup.</p>
          </div>
        </div>
      )}

      {/* Token list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Existing Embed Codes for {selectedStore?.name}</Label>
          {loading && <RefreshCw size={14} className="text-slate-400 animate-spin" />}
        </div>

        {!loading && tokens.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Code size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-bold">No embed codes yet. Generate one above.</p>
          </div>
        )}

        {tokens.length > 0 && (
          <div className="border border-slate-100 rounded-[24px] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Label</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Token</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tokens.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{t.label || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {t.token.slice(0, 12)}…
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${t.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${t.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {t.active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {t.active && (
                          <button
                            onClick={() => copyEmbed(t)}
                            title="Copy embed code"
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            {copiedId === t.id ? <CheckCircle size={15} className="text-emerald-500" /> : <Copy size={15} />}
                          </button>
                        )}
                        {t.active && (
                          <button
                            onClick={() => handleRevoke(t)}
                            title="Revoke (disable without deleting)"
                            className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                          >
                            <ToggleRight size={15} />
                          </button>
                        )}
                        {!t.active && (
                          <span className="p-2 text-slate-200">
                            <ToggleLeft size={15} />
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(t)}
                          title="Delete permanently"
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">How It Works</h4>
        <ol className="text-xs text-slate-600 font-bold space-y-2 list-decimal list-inside">
          <li>Generate an embed code for a store above</li>
          <li>Paste the <code className="bg-slate-200 px-1 rounded text-slate-800">&lt;script&gt;</code> tag anywhere on the store owner's website</li>
          <li>A branded contact form appears automatically — no plugins required</li>
          <li>Every submission goes directly into that store's CRM as a new lead</li>
          <li>Revoke a code anytime to disable the form without deleting its history</li>
        </ol>
        <p className="text-[10px] text-slate-400 font-bold italic">
          Each token is tied to a specific store. The token is public but harmless — it can only create leads, nothing else.
        </p>
      </div>
    </div>
  );
};

export default EmbedCodeGenerator;
