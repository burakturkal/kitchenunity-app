import React, { useState, useEffect } from 'react';
import { Code, Copy, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { CabinetStore } from '../types';

// Supabase connection — anon key is intentionally public (read: Supabase docs)
const SUPABASE_URL = 'https://ffhdrhvstaonvcludbgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaGRyaHZzdGFvbnZjbHVkYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODY3NzQsImV4cCI6MjA4NDQ2Mjc3NH0.UIopiTghepauzs-IKLOa0zZ176JFwO3jbXS8jbeAZG8';

const DEFAULT_HTML = `<form style="display:flex;flex-direction:column;gap:12px;max-width:480px;padding:28px 32px;background:#fff;border-radius:14px;border:1.5px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 24px rgba(0,0,0,.07);">
  <h3 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-.4px;">Get in Touch</h3>
  <p style="margin:0 0 8px;font-size:12px;color:#64748b;">Fill out the form and we will get back to you shortly.</p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <input name="firstName" placeholder="First Name *" required style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;">
    <input name="lastName" placeholder="Last Name" style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;">
  </div>
  <input name="email" type="email" placeholder="Email *" required style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;">
  <input name="phone" type="tel" placeholder="Phone" style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;">
  <textarea name="message" placeholder="Tell us about your project..." rows="4" style="padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;resize:vertical;font-family:inherit;"></textarea>

  <button type="submit" style="padding:13px;background:#1e3a8a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;text-transform:uppercase;letter-spacing:.08em;font-family:inherit;">Send Message</button>
  <div id="ku-msg" style="display:none;padding:10px 14px;border-radius:8px;font-size:12px;font-weight:700;"></div>
</form>`;

function buildEmbedSnippet(storeId: string, storeName: string, html: string): string {
  const uid = `ku-${storeId.slice(0, 8)}-${Date.now().toString(36)}`;

  return `<!-- KitchenUnity Lead Form | ${storeName} -->
<div id="${uid}">${html}</div>
<script>
(function(){
  var ROOT=document.getElementById('${uid}');
  var STORE_ID='${storeId}';
  var SB_URL='${SUPABASE_URL}';
  var SB_KEY='${SUPABASE_ANON_KEY}';
  var form=ROOT.querySelector('form');
  if(!form){console.error('[KU Embed] No <form> found in embed block.');return;}

  /* Honeypot — hidden from humans, bots fill it automatically */
  var hp=document.createElement('input');
  hp.type='text';hp.name='_hp';hp.tabIndex=-1;hp.autocomplete='off';
  hp.style.cssText='position:absolute;left:-9999px;height:0;opacity:0;';
  form.appendChild(hp);

  /* Message element — use #ku-msg if in template, otherwise create one */
  var msg=ROOT.querySelector('#ku-msg')||ROOT.querySelector('.ku-msg');
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

  function sendToSupabase(payload){
    fetch(SB_URL+'/rest/v1/leads',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey':SB_KEY,
        'Authorization':'Bearer '+SB_KEY,
        'Prefer':'return=minimal'
      },
      body:JSON.stringify(payload)
    }).catch(function(err){
      console.error('[KU Embed] Supabase error:',err.message);
    });
  }

  function collectFields(){
    var f={};
    form.querySelectorAll('input,textarea,select').forEach(function(el){
      if(el.name&&el.name!=='_hp')f[el.name]=el.value.trim();
    });
    /* Capture step-form button selections (owner/budget) by reading selected DOM state */
    var ownerEl=ROOT.querySelector('.option-btn.selected');
    var budgetEl=ROOT.querySelector('.budget-btn.selected');
    var extras=[];
    if(ownerEl)extras.push('Owner: '+ownerEl.dataset.val);
    if(budgetEl)extras.push('Budget: '+budgetEl.dataset.val);
    var firstName=f.firstName||f.first_name||'';
    var lastName=f.lastName||f.last_name||'';
    return {
      name:f.name||(firstName+' '+lastName).trim()||null,
      email:(f.email||'').toLowerCase()||null,
      phone:f.phone||null,
      message:[f.message||f.textarea||f.notes||''].concat(extras).filter(Boolean).join(' | ')||null
    };
  }

  /* ── Standard form: type=submit button fires a submit event ── */
  var btn=form.querySelector('button[type=submit]');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(hp.value)return;
    var d=collectFields();
    if(!d.name&&!d.email&&!d.phone){showMsg('Please fill in at least your name and email.',false);return;}
    if(btn){btn.disabled=true;btn.textContent='Sending...';}
    msg.style.display='none';
    fetch(SB_URL+'/rest/v1/leads',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Prefer':'return=minimal'},
      body:JSON.stringify({store_id:STORE_ID,name:d.name,email:d.email,phone:d.phone,source:'Embedded Form',status:'New'})
    })
    .then(function(r){
      if(r.ok||r.status===201){
        form.reset();
        showMsg('Message received! We will be in touch soon.',true);
        if(btn){btn.textContent='Sent!';setTimeout(function(){btn.disabled=false;btn.textContent='Send Message';},6000);}
      }else{
        return r.json().then(function(d){throw new Error(d.message||'Error '+r.status);});
      }
    })
    .catch(function(err){
      showMsg(err.message||'Something went wrong. Please try again.',false);
      if(btn){btn.disabled=false;btn.textContent='Send Message';}
    });
  });

  /* ── Multi-step form: template calls window.submitForm() directly ──
     Wrap it so data is captured before the template hides the fields,
     then send to Supabase after the template's own validation passes.  */
  if(typeof window.submitForm==='function'){
    var _origSubmitForm=window.submitForm;
    window.submitForm=function(){
      if(hp.value)return;
      /* Snapshot fields NOW — template may hide/reset them inside _orig */
      var snapshot=collectFields();
      /* Run template's original: handles validation + shows success UI */
      _origSubmitForm.apply(this,arguments);
      /* If the form is still visible, validation failed — abort */
      if(form.style.display!=='none')return;
      /* Validation passed — send to Supabase in background */
      sendToSupabase({store_id:STORE_ID,name:snapshot.name,email:snapshot.email,phone:snapshot.phone,message:snapshot.message,source:'Embedded Form',status:'New'});
    };
  }
})();
</script>`;
}

interface EmbedCodeGeneratorProps {
  stores: CabinetStore[];
}

const EmbedCodeGenerator: React.FC<EmbedCodeGeneratorProps> = ({ stores }) => {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || '');
  const [html, setHtml] = useState('');
  const [generatedSnippet, setGeneratedSnippet] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load saved HTML from localStorage when store changes
  useEffect(() => {
    if (!selectedStoreId) return;
    const saved = localStorage.getItem(`ku_embed_html_${selectedStoreId}`);
    setHtml(saved ?? DEFAULT_HTML);
    setGeneratedSnippet('');
    setCopied(false);
  }, [selectedStoreId]);

  function handleGenerate() {
    const store = stores.find(s => s.id === selectedStoreId);
    if (!store || !html.trim()) return;
    // Persist the HTML so the superadmin can come back and edit
    localStorage.setItem(`ku_embed_html_${selectedStoreId}`, html);
    setGeneratedSnippet(buildEmbedSnippet(store.id, store.name, html.trim()));
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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Live Preview (approximate — final render depends on host page)</p>
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
          Use <code className="bg-slate-100 px-1 rounded text-slate-700">name="firstName"</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">name="lastName"</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">name="email"</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">name="phone"</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">name="message"</code> on your inputs. Must include a <code className="bg-slate-100 px-1 rounded text-slate-700">&lt;form&gt;</code> element.
        </p>
      </div>

      {/* Compatibility guidelines */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Form Compatibility Checklist</p>
        </div>
        <div className="divide-y divide-slate-100">

          {/* Required */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-3">Required</p>
            <ul className="space-y-2">
              {[
                ['<form> element', 'The wrapper finds the form by querying for a <form> tag. Without it, nothing gets wired up.'],
                ['name="email" or name="phone"', 'At least one of these must be present and filled — used as the minimum viable lead.'],
                ['name="firstName" + name="lastName" or name="name"', 'Used to populate the lead\'s name. Either split or combined is fine.'],
              ].map(([label, detail]) => (
                <li key={label} className="flex gap-3">
                  <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-[9px] font-black">!</span>
                  <div>
                    <code className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{label}</code>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Standard forms */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3">Standard Forms</p>
            <ul className="space-y-2">
              {[
                ['<button type="submit">', 'Must use type="submit" so the wrapper\'s submit event fires. type="button" will not trigger it.'],
                ['name="phone", name="message"', 'Optional but recommended. Collected automatically if present.'],
                ['<div id="ku-msg">', 'Optional. If present, success/error messages are injected here. Otherwise a message div is appended to the form.'],
              ].map(([label, detail]) => (
                <li key={label} className="flex gap-3">
                  <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-[9px] font-black">i</span>
                  <div>
                    <code className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{label}</code>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Multi-step forms */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-3">Multi-Step Forms</p>
            <ul className="space-y-2">
              {[
                ['window.submitForm()', 'If your form uses a custom submitForm() function instead of type="submit", the wrapper automatically wraps it. Validation must hide the <form> element (form.style.display="none") on success — that\'s the signal the wrapper uses to detect that validation passed.'],
                ['.option-btn.selected / .budget-btn.selected', 'Click-to-select step buttons are captured by reading the .selected class at submit time. Their data-val is appended to the message field as "Owner: yes | Budget: 25-75k".'],
                ['No form.reset() after multi-step submit', 'The wrapper snapshots field values before calling your submitForm(), so resetting the DOM inside it is fine — data is already captured.'],
              ].map(([label, detail]) => (
                <li key={label} className="flex gap-3">
                  <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded-full bg-violet-100 text-violet-500 flex items-center justify-center text-[9px] font-black">↗</span>
                  <div>
                    <code className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{label}</code>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* What never works */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">Will Not Work</p>
            <ul className="space-y-2">
              {[
                ['No <form> tag', 'Div-based or table-based layouts with no <form> element are ignored entirely.'],
                ['type="button" with no submitForm()', 'If your submit button is type="button" and there\'s no window.submitForm, nothing will be intercepted.'],
                ['iframes or shadow DOM', 'The wrapper can\'t reach inside iframes or shadow roots — keep all form HTML in the same document.'],
                ['Required field validation via browser', 'The browser\'s native required validation fires a submit event that the wrapper intercepts correctly, but custom validation that returns early without hiding the form will silently pass. Validate before the form is hidden.'],
              ].map(([label, detail]) => (
                <li key={label} className="flex gap-3">
                  <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[9px] font-black">✕</span>
                  <div>
                    <code className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{label}</code>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!html.trim() || !selectedStoreId}
        className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-60 transition-all"
      >
        <Code size={16} /> Generate Embed Code
      </button>

      {/* Generated snippet */}
      {generatedSnippet && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
              <CheckCircle size={14} /> Embed code ready for {selectedStore?.name}
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

          <div className="p-5 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">How to use</p>
            <ol className="text-xs text-slate-600 font-bold space-y-1.5 list-decimal list-inside">
              <li>Copy the code above</li>
              <li>Paste it anywhere on the website — a page, popup, sidebar, contact section</li>
              <li>That's it. Leads go directly into <strong>{selectedStore?.name}</strong>'s CRM</li>
            </ol>
            <p className="text-[10px] text-slate-400 font-bold italic pt-1">
              To update the form design, edit the HTML here and generate a new code — then replace the old snippet on the website.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbedCodeGenerator;
