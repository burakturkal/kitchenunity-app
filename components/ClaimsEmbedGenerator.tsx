
import React, { useState, useEffect } from 'react';
import { Code, Copy, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { CabinetStore } from '../types';

const SUPABASE_URL = 'https://ffhdrhvstaonvcludbgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaGRyaHZzdGFvbnZjbHVkYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODY3NzQsImV4cCI6MjA4NDQ2Mjc3NH0.UIopiTghepauzs-IKLOa0zZ176JFwO3jbXS8jbeAZG8';

const DEFAULT_HTML = `<form style="display:flex;flex-direction:column;gap:12px;max-width:480px;padding:28px 32px;background:#fff;border-radius:14px;border:1.5px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 24px rgba(0,0,0,.07);">
  <h3 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-.4px;">Submit a Claim</h3>
  <p style="margin:0 0 8px;font-size:12px;color:#64748b;">Fill out the form and our team will follow up with you shortly.</p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <input name="firstName" placeholder="First Name *" required style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;">
    <input name="lastName" placeholder="Last Name" style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;">
  </div>
  <input name="email" type="email" placeholder="Email *" required style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;">
  <input name="phone" type="tel" placeholder="Phone" style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;">
  <input name="orderId" placeholder="Order / Invoice # (if known)" style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;">
  <textarea name="issue" placeholder="Describe the issue *" rows="4" required style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;resize:vertical;font-family:inherit;"></textarea>

  <button type="submit" style="padding:13px;background:#dc2626;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;text-transform:uppercase;letter-spacing:.08em;font-family:inherit;">Submit Claim</button>
  <div id="ku-claim-msg" style="display:none;padding:10px 14px;border-radius:8px;font-size:12px;font-weight:700;"></div>
</form>`;

function buildClaimsEmbedSnippet(storeId: string, storeName: string, html: string): string {
  const uid = `ku-claim-${storeId.slice(0, 8)}-${Date.now().toString(36)}`;

  return `<!-- KitchenUnity Claim Form | ${storeName} -->
<div id="${uid}">${html}</div>
<script>
(function(){
  var ROOT=document.getElementById('${uid}');
  var STORE_ID='${storeId}';
  var SB_URL='${SUPABASE_URL}';
  var SB_KEY='${SUPABASE_ANON_KEY}';
  var form=ROOT.querySelector('form');
  if(!form){console.error('[KU Claim Embed] No <form> found.');return;}

  /* Honeypot */
  var hp=document.createElement('input');
  hp.type='text';hp.name='_hp';hp.tabIndex=-1;hp.autocomplete='off';
  hp.style.cssText='position:absolute;left:-9999px;height:0;opacity:0;';
  form.appendChild(hp);

  /* Message element */
  var msg=ROOT.querySelector('#ku-claim-msg')||ROOT.querySelector('.ku-claim-msg');
  if(!msg){
    msg=document.createElement('div');
    msg.style.cssText='margin-top:10px;padding:10px 14px;border-radius:8px;font-size:12px;font-weight:700;display:none;font-family:inherit;';
    form.appendChild(msg);
  }
  function showMsg(text,ok){
    msg.textContent=text;msg.style.display='block';
    msg.style.background=ok?'#f0fdf4':'#fef2f2';
    msg.style.color=ok?'#16a34a':'#dc2626';
    msg.style.border='1px solid '+(ok?'#bbf7d0':'#fecaca');
  }

  var btn=form.querySelector('button[type=submit]');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(hp.value)return;
    var f={};
    form.querySelectorAll('input,textarea,select').forEach(function(el){
      if(el.name&&el.name!=='_hp')f[el.name]=el.value.trim();
    });
    var firstName=f.firstName||f.first_name||'';
    var lastName=f.lastName||f.last_name||'';
    var name=(f.name||(firstName+' '+lastName).trim()||'').trim();
    var issue=f.issue||f.description||f.message||'';
    if(!issue){showMsg('Please describe the issue.',false);return;}
    if(!name&&!f.email&&!f.phone){showMsg('Please fill in your name and contact info.',false);return;}
    var notesParts=['Contact: '+name];
    if(f.email)notesParts.push('Email: '+f.email);
    if(f.phone)notesParts.push('Phone: '+f.phone);
    if(f.orderId)notesParts.push('Order #: '+f.orderId);
    var notes=notesParts.join(' | ');
    if(btn){btn.disabled=true;btn.textContent='Submitting...';}
    msg.style.display='none';
    fetch(SB_URL+'/rest/v1/claims',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Prefer':'return=minimal'},
      body:JSON.stringify({store_id:STORE_ID,issue:issue,notes:notes,status:'Open'})
    })
    .then(function(r){
      if(r.ok||r.status===201){
        form.reset();
        showMsg('Claim received! We will contact you shortly.',true);
        if(btn){btn.textContent='Submitted!';setTimeout(function(){btn.disabled=false;btn.textContent='Submit Claim';},6000);}
      }else{
        return r.json().then(function(d){throw new Error(d.message||'Error '+r.status);});
      }
    })
    .catch(function(err){
      showMsg(err.message||'Something went wrong. Please try again.',false);
      if(btn){btn.disabled=false;btn.textContent='Submit Claim';}
    });
  });
})();
</script>`;
}

interface ClaimsEmbedGeneratorProps {
  stores: CabinetStore[];
}

const ClaimsEmbedGenerator: React.FC<ClaimsEmbedGeneratorProps> = ({ stores }) => {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || '');
  const [html, setHtml] = useState('');
  const [generatedSnippet, setGeneratedSnippet] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!selectedStoreId) return;
    const saved = localStorage.getItem(`ku_claim_embed_html_${selectedStoreId}`);
    setHtml(saved ?? DEFAULT_HTML);
    setGeneratedSnippet('');
    setCopied(false);
  }, [selectedStoreId]);

  function handleGenerate() {
    const store = stores.find(s => s.id === selectedStoreId);
    if (!store || !html.trim()) return;
    localStorage.setItem(`ku_claim_embed_html_${selectedStoreId}`, html);
    setGeneratedSnippet(buildClaimsEmbedSnippet(store.id, store.name, html.trim()));
    setCopied(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleReset() {
    setHtml(DEFAULT_HTML);
    setGeneratedSnippet('');
  }

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  return (
    <div className="space-y-8">
      {/* Store selector */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Store</label>
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

      {/* Info callout */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-700 font-semibold">
        Submitted claims will appear in <strong>Claim Management</strong> with status <strong>Open</strong>. Contact info (name, email, phone, order #) is saved in the claim's notes field so the store owner can link it to a customer record.
      </div>

      {/* HTML editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Form HTML for <span className="text-slate-700">{selectedStore?.name}</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
            >
              {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
            >
              <RefreshCw size={12} /> Reset Default
            </button>
          </div>
        </div>

        {showPreview ? (
          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 min-h-[300px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Live Preview</p>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : (
          <textarea
            value={html}
            onChange={e => setHtml(e.target.value)}
            spellCheck={false}
            rows={18}
            className="w-full px-4 py-4 bg-slate-900 text-blue-300 font-mono text-xs rounded-2xl border border-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 resize-y leading-relaxed"
          />
        )}

        <p className="text-[10px] text-slate-400 font-bold">
          Required fields: <code className="bg-slate-100 px-1 rounded text-slate-700">name="issue"</code> (claim description) + at least one of <code className="bg-slate-100 px-1 rounded text-slate-700">name="firstName"</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">name="email"</code>, or <code className="bg-slate-100 px-1 rounded text-slate-700">name="phone"</code>. Optional: <code className="bg-slate-100 px-1 rounded text-slate-700">name="orderId"</code>.
        </p>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!html.trim() || !selectedStoreId}
        className="flex items-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 disabled:opacity-60 transition-all"
      >
        <Code size={16} /> Generate Claim Form Code
      </button>

      {/* Generated snippet */}
      {generatedSnippet && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
              <CheckCircle size={14} /> Claim embed ready for {selectedStore?.name}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
            >
              {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-700 overflow-x-auto">
            <pre className="font-mono text-[11px] text-blue-300 whitespace-pre-wrap break-all leading-relaxed">
              {generatedSnippet}
            </pre>
          </div>

          <div className="p-5 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">How to use</p>
            <ol className="text-xs text-slate-600 font-bold space-y-1.5 list-decimal list-inside">
              <li>Copy the code above</li>
              <li>Paste it on the store's warranty, support, or contact page</li>
              <li>Submitted claims appear instantly in <strong>{selectedStore?.name}</strong>'s Claim Management tab</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimsEmbedGenerator;
