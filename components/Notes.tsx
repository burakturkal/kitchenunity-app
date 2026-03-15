import React, { useState } from 'react';
import { StickyNote, ChevronDown, ChevronRight, User, Database, ShieldCheck } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  category: string;
  content: React.ReactNode;
}

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="bg-slate-900 text-emerald-400 text-xs font-mono rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-words">
    {children}
  </pre>
);

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div className="flex gap-3">
    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-black rounded-full flex items-center justify-center mt-0.5">{n}</span>
    <div className="text-sm text-slate-700 font-medium leading-relaxed">{children}</div>
  </div>
);

const NOTES: Note[] = [
  {
    id: 'new-user',
    title: 'How to Create a New Store User',
    category: 'User Management',
    content: (
      <div className="space-y-5">
        <p className="text-sm text-slate-600 font-medium">
          New users cannot be created from within the app — you must do it through Supabase. Follow these steps every time you onboard a new store owner or staff member.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">Before You Start</p>
          <p className="text-xs text-amber-700 font-medium">
            The <code className="bg-amber-100 px-1 rounded font-mono">handle_new_user()</code> trigger must be set to insert <code className="bg-amber-100 px-1 rounded font-mono">role = 'staff'</code>. Run the SQL below once if you haven't already.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Step 1 — Fix the trigger (one-time, run once)</p>
          <CodeBlock>{`CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'staff');
  RETURN new;
END;
$$;`}</CodeBlock>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Step 2 — Create the user in Supabase Auth</p>
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Authentication → Users</strong> in your Supabase project dashboard.</Step>
            <Step n={2}>Click <strong>Add user → Create new user</strong>.</Step>
            <Step n={3}>Enter the user's email address and set a password for them.</Step>
            <Step n={4}>Click <strong>Create user</strong>. Supabase will assign them a UUID — copy it.</Step>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Step 3 — Link user to their store</p>
          <p className="text-sm text-slate-600 font-medium">Run this in the <strong>SQL Editor</strong>, replacing the UUIDs:</p>
          <CodeBlock>{`UPDATE public.profiles
SET role = 'admin', store_id = '<store-uuid>'
WHERE id = '<new-user-uuid>';`}</CodeBlock>
          <p className="text-xs text-slate-500 font-medium">
            Use <code className="bg-slate-100 px-1 rounded font-mono">role = 'admin'</code> for store owners. Use <code className="bg-slate-100 px-1 rounded font-mono">role = 'staff'</code> for regular staff.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Where to find store UUIDs</p>
          <CodeBlock>{`SELECT id, name FROM public.stores ORDER BY name;`}</CodeBlock>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Valid role values</p>
          <div className="flex gap-2 flex-wrap mt-2">
            {['super_admin', 'admin', 'staff'].map(r => (
              <span key={r} className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg font-mono">{r}</span>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-2">Any other value will be rejected by the database constraint <code className="font-mono">profiles_role_check</code>.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'facebook-rls',
    title: 'Fix 403 When Saving Facebook Settings on a New Store',
    category: 'Troubleshooting',
    content: (
      <div className="space-y-5">
        <p className="text-sm text-slate-600 font-medium">
          If Facebook Page ID / Token saves give a 403 error on a brand-new store, the <code className="bg-slate-100 px-1 rounded font-mono">facebook_page_store_map</code> table is missing RLS policies. Run this migration once:
        </p>
        <CodeBlock>{`-- Enable RLS
ALTER TABLE public.facebook_page_store_map ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "superadmin_select_fb_map" ON public.facebook_page_store_map;
DROP POLICY IF EXISTS "superadmin_insert_fb_map" ON public.facebook_page_store_map;
DROP POLICY IF EXISTS "superadmin_update_fb_map" ON public.facebook_page_store_map;
DROP POLICY IF EXISTS "superadmin_delete_fb_map" ON public.facebook_page_store_map;

-- Grant superadmins full access
CREATE POLICY "superadmin_select_fb_map"
  ON public.facebook_page_store_map FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "superadmin_insert_fb_map"
  ON public.facebook_page_store_map FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "superadmin_update_fb_map"
  ON public.facebook_page_store_map FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "superadmin_delete_fb_map"
  ON public.facebook_page_store_map FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));`}</CodeBlock>
      </div>
    ),
  },
  {
    id: 'csv-import',
    title: 'CSV Lead Import — Format Reference',
    category: 'Leads',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 font-medium">
          Use the <strong>Import CSV</strong> button in the Leads tab (superadmin only) to bulk-import leads. The CSV must have a header row.
        </p>
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Supported columns</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {[
              ['first_name / firstname', 'First name'],
              ['last_name / lastname', 'Last name'],
              ['name / full_name', 'Full name (auto-split)'],
              ['email', 'Email address'],
              ['phone', 'Phone number'],
              ['source', 'Lead source (e.g. Facebook)'],
              ['status', 'New / Contacted / Qualified / Closed'],
              ['notes / message', 'Notes or message'],
              ['created_at / date', 'Original lead date'],
            ].map(([col, desc]) => (
              <React.Fragment key={col}>
                <code className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">{col}</code>
                <span className="text-xs text-slate-500 font-medium">{desc}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">Date Format</p>
          <p className="text-xs text-amber-700 font-medium">
            Dates must use <code className="bg-amber-100 px-1 rounded font-mono">MM/DD/YYYY H:MMAM</code> or <code className="bg-amber-100 px-1 rounded font-mono">MM/DD/YYYY H:MMPM</code> format. <strong>AM/PM must be uppercase.</strong>
          </p>
          <code className="text-[10px] font-mono block mt-1 text-amber-700">Example: 03/14/2026 4:11PM</code>
        </div>
        <CodeBlock>{`first_name,last_name,email,phone,source,created_at
John,Smith,john@example.com,555-1234,Facebook,03/14/2026 4:11PM
Jane,Doe,jane@example.com,555-5678,Instagram,03/13/2026 10:30AM`}</CodeBlock>
      </div>
    ),
  },
];

const CATEGORIES = [...new Set(NOTES.map(n => n.category))];
const CATEGORY_ICONS: Record<string, any> = {
  'User Management': User,
  'Troubleshooting': ShieldCheck,
  'Leads': Database,
};

const Notes: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(NOTES[0].id);

  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Admin Notes</h2>
        <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Superadmin reference — operational procedures & troubleshooting</p>
      </div>

      {CATEGORIES.map(cat => {
        const CatIcon = CATEGORY_ICONS[cat] || StickyNote;
        const catNotes = NOTES.filter(n => n.category === cat);
        return (
          <div key={cat} className="space-y-3">
            <div className="flex items-center gap-2">
              <CatIcon size={14} className="text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cat}</p>
            </div>
            <div className="space-y-2">
              {catNotes.map(note => {
                const isOpen = openId === note.id;
                return (
                  <div key={note.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggle(note.id)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm font-black text-slate-800 tracking-tight">{note.title}</span>
                      {isOpen ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-1 duration-150">
                        {note.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Notes;
