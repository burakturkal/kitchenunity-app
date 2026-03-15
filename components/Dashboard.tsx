
import React, { useMemo } from 'react';
import {
  ShoppingBag,
  Users,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Target,
  Zap,
  Flame,
  Filter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Lead, Order, Claim, Customer, LeadStatus } from '../types';

interface DashboardProps {
  leads: Lead[];
  orders: Order[];
  claims: Claim[];
  customers: Customer[];
}

const Dashboard: React.FC<DashboardProps> = ({ leads, orders, claims, customers }) => {
  // Aggregate revenue by month for chart
  const revenueData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - idx));
      return { key: `${d.getFullYear()}-${d.getMonth()}`, name: d.toLocaleString('default', { month: 'short' }), total: 0 };
    });

    const map = new Map(months.map(m => [m.key, m]));
    orders.forEach(o => {
      const created = new Date(o.createdAt);
      if (isNaN(created.getTime())) return;
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      const bucket = map.get(key);
      if (bucket) bucket.total += o.amount || 0;
    });

    return months;
  }, [orders]);

  const leadSourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const src = l.source || 'Direct';
      counts[src] = (counts[src] || 0) + 1;
    });
    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    return data.length > 0 ? data : [{ name: 'No Data', value: 0 }];
  }, [leads]);

  const sourceBreakdown = useMemo(() => {
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const lastMonthKey = `${now.getFullYear()}-${now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1}`;

    const map: Record<string, { total: number; active: number; closed: number; thisMonth: number; lastMonth: number }> = {};
    leads.forEach(l => {
      const src = l.source || 'Direct';
      if (!map[src]) map[src] = { total: 0, active: 0, closed: 0, thisMonth: 0, lastMonth: 0 };
      map[src].total++;
      const isClosed = l.status === LeadStatus.CLOSED || l.status === LeadStatus.ARCHIVED;
      if (isClosed) map[src].closed++; else map[src].active++;
      const created = new Date(l.createdAt);
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      if (key === thisMonthKey) map[src].thisMonth++;
      if (key === lastMonthKey) map[src].lastMonth++;
    });

    const total = leads.length || 1;
    return Object.entries(map)
      .map(([source, d]) => ({
        source,
        ...d,
        pct: Math.round((d.total / total) * 100),
        convRate: d.total > 0 ? Math.round((d.closed / d.total) * 100) : 0,
        trend: d.thisMonth - d.lastMonth,
      }))
      .sort((a, b) => b.total - a.total);
  }, [leads]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const activeLeads = leads.filter(l => l.status !== LeadStatus.CLOSED && l.status !== LeadStatus.ARCHIVED).length;
  const leadsThisMonth = useMemo(() => {
    const now = new Date();
    return leads.filter(l => {
      const d = new Date(l.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [leads]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden group bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[32px] text-white shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
             <ShoppingBag size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 mb-1">Gross Revenue</p>
            <h4 className="text-4xl font-black tracking-tighter">${totalRevenue.toLocaleString()}</h4>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md">
               <ArrowUpRight size={14} className="text-emerald-400" /> +12.5% Growth
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden group bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Users size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Pipeline</p>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{customers.length + leads.length}</h4>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              {activeLeads} Active Leads
            </div>
          </div>
        </div>

<div className="relative overflow-hidden group bg-gradient-to-br from-emerald-400 to-teal-500 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-1 ring-4 ring-emerald-300/40">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform">
             <Target size={120} />
          </div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-1">Leads This Month</p>
           <h4 className="text-4xl font-black text-white tracking-tighter drop-shadow">{leadsThisMonth}</h4>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-100">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {new Date().toLocaleString('default', { month: 'long' })}
          </div>
        </div>
      </div>

      {/* Lead Conversion Origins — Full Width */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Filter size={15} className="text-blue-500" />
              Lead Conversion Origins
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Source performance — volume, activity &amp; conversion</p>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>{leads.length} Total Leads</span>
            <span className="text-blue-500">{sourceBreakdown.length} Sources</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Bar Chart */}
          <div className="lg:col-span-2 p-6 border-r border-slate-100">
            <ResponsiveContainer width="100%" height={Math.max(160, sourceBreakdown.length * 44)}>
              <BarChart data={leadSourceData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#1e293b'}} width={90} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                  {leadSourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown Table */}
          <div className="lg:col-span-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">Source</th>
                  <th className="px-4 py-4 text-right">Total</th>
                  <th className="px-4 py-4 text-right">Share</th>
                  <th className="px-4 py-4 text-right">Active</th>
                  <th className="px-4 py-4 text-right">Closed</th>
                  <th className="px-4 py-4 text-right">Conv. Rate</th>
                  <th className="px-4 py-4 text-right">This Month</th>
                  <th className="px-4 py-4 text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sourceBreakdown.length > 0 ? sourceBreakdown.map((row, i) => (
                  <tr key={row.source} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981'][i % 6] }} />
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wide">{row.source}</span>
                        {i === 0 && <span className="text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Flame size={8} /> Top</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-black text-slate-900">{row.total}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981'][i % 6] }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 w-8 text-right">{row.pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right"><span className="text-xs font-bold text-indigo-600">{row.active}</span></td>
                    <td className="px-4 py-4 text-right"><span className="text-xs font-bold text-slate-400">{row.closed}</span></td>
                    <td className="px-4 py-4 text-right">
                      <span className={`text-xs font-black ${row.convRate >= 50 ? 'text-emerald-600' : row.convRate >= 25 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {row.convRate}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right"><span className="text-xs font-bold text-slate-700">{row.thisMonth}</span></td>
                    <td className="px-4 py-4 text-right">
                      {row.trend > 0
                        ? <span className="text-[10px] font-black text-emerald-600">▲ {row.trend}</span>
                        : row.trend < 0
                        ? <span className="text-[10px] font-black text-rose-500">▼ {Math.abs(row.trend)}</span>
                        : <span className="text-[10px] font-bold text-slate-300">—</span>
                      }
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-xs text-slate-400 font-bold">No lead data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        {sourceBreakdown.length > 0 && (
          <div className="border-t border-slate-100 px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50/40">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Top Source</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{sourceBreakdown[0].source}</p>
              <p className="text-[10px] text-blue-500 font-bold">{sourceBreakdown[0].pct}% of all leads</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Best Conv. Rate</p>
              {(() => { const best = [...sourceBreakdown].sort((a,b) => b.convRate - a.convRate)[0]; return (<><p className="text-sm font-black text-slate-900 mt-0.5">{best.source}</p><p className="text-[10px] text-emerald-600 font-bold">{best.convRate}% closed</p></>); })()}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">This Month Total</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{sourceBreakdown.reduce((s,r) => s + r.thisMonth, 0)} leads</p>
              <p className="text-[10px] text-slate-400 font-bold">across {sourceBreakdown.filter(r => r.thisMonth > 0).length} sources</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Pipeline</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{sourceBreakdown.reduce((s,r) => s + r.active, 0)} leads</p>
              <p className="text-[10px] text-slate-400 font-bold">not yet closed</p>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            Revenue Trajectory
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Last 6 Months Performance</p>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
              <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }} itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#1e293b' }} />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Ledger */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 tracking-tight leading-none">Global Event Ledger</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Real-time synchronization active</p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-full tracking-wide flex items-center gap-2">
            <Clock size={12} className="animate-spin-slow" />
            Live Sync
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/60 text-xs font-semibold text-slate-500 tracking-normal border-b border-slate-100">
                <th className="px-10 py-5">Entity Email</th>
                <th className="px-10 py-5">Source Name</th>
                <th className="px-10 py-5">Operational Status</th>
                <th className="px-10 py-5">Fulfillment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length > 0 ? (
                leads.slice(0, 5).map((lead) => (
                  <tr key={lead.id} className="odd:bg-slate-50/40 hover:bg-slate-100/60 transition-colors group">
                    <td className="px-10 py-5">
                       <span className="text-sm font-semibold text-blue-600 decoration-blue-200/60 underline underline-offset-4">{lead.email}</span>
                    </td>
                    <td className="px-10 py-5">
                       <span className="text-sm text-slate-900 font-semibold tracking-tight">{lead.firstName} {lead.lastName}</span>
                       <span className="text-xs text-slate-500 block font-medium">Via {lead.source}</span>
                    </td>
                    <td className="px-10 py-5">
                       <span className="text-[11px] font-semibold bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                          {lead.status}
                       </span>
                    </td>
                    <td className="px-10 py-5 text-xs text-slate-500 font-medium">
                       {new Date(lead.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-slate-500 font-semibold text-sm">Waiting for inbound data streams...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
