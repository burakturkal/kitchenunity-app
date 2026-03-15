import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Loader2, Sparkles } from 'lucide-react';

interface RequestDesignModalProps {
  storeName: string;
  onClose: () => void;
}

interface AttachedFile {
  name: string;
  size: number;
  base64: string;
  type: string;
}

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ffhdrhvstaonvcludbgn.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_in95qOxRG0FXiOVUHrGF_g_LL7uwRYi';

const RequestDesignModal: React.FC<RequestDesignModalProps> = ({ storeName, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [cabinetColor, setCabinetColor] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    selected.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 10MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setFiles(prev => [...prev, { name: file.name, size: file.size, base64, type: file.type }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleFinalize = async () => {
    if (!customerName.trim()) { setError('Customer name is required.'); return; }
    setError('');
    setIsSubmitting(true);

    // Save form data so the cancel handler can send the abandoned-payment email
    const cancelPayload = {
      storeName: storeName.trim(),
      customerName: customerName.trim(),
      cabinetColor: cabinetColor.trim(),
      projectDescription: projectDescription.trim(),
    };
    sessionStorage.setItem('designCancelData', JSON.stringify(cancelPayload));
    sessionStorage.setItem('designPending', '1');

    const baseUrl = window.location.href.split('?')[0];

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-design-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          storeName: storeName.trim(),
          customerName: customerName.trim(),
          projectDescription: projectDescription.trim(),
          cabinetColor: cabinetColor.trim(),
          files,
          successUrl: baseUrl + '?design_success=1',
          cancelUrl: baseUrl + '?design_cancelled=1',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Professional Design Service</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Request a Design</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">$29 · 24-hour turnaround · 2 revisions · PDF + 2020 files</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Store Name</label>
            <input
              type="text"
              value={storeName}
              readOnly
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Customer Name <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cabinet Color <span className="text-slate-300">(optional)</span></label>
            <input
              type="text"
              value={cabinetColor}
              onChange={e => setCabinetColor(e.target.value)}
              placeholder="e.g. Shaker White, Graphite Gray"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Project Description <span className="text-slate-300">(optional)</span></label>
            <textarea
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
              rows={3}
              placeholder="Describe the project, room dimensions, style preferences..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 resize-none"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Attachments <span className="text-slate-300">(optional · max 10MB each)</span></label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all text-sm font-bold"
            >
              <Upload size={16} /> Click to attach files
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-700 truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs font-bold text-rose-500 bg-rose-50 px-4 py-3 rounded-xl">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4 text-xs text-slate-400 font-medium">
            <span>✓ 24-hour turnaround</span>
            <span>·</span>
            <span>✓ 2 revisions included</span>
            <span>·</span>
            <span>✓ PDF + 2020 files</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleFinalize}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-60"
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Preparing checkout...</> : <>Finalize — $29</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RequestDesignModal;
