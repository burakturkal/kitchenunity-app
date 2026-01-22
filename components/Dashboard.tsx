
import React, { useMemo } from 'react';
import { 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  ArrowUpRight,
  Target,
  Zap
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

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const activeLeads = leads.filter(l => l.status !== LeadStatus.CLOSED && l.status !== LeadStatus.ARCHIVED).length;
  const completionRate = orders.length > 0
    ? Math.round((orders.filter(o => o.status === 'Completed').length / orders.length) * 100)
    : 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="relative overflow-hidden group bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
           <div className="absolute top-0 right-0 p-4 opacity-5">
             <AlertTriangle size={120} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Active Claims</p>
          <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{claims.filter(c => c.status !== 'Resolved').length}</h4>
          <p className="mt-4 text-xs font-bold text-rose-500 flex items-center gap-1">
            <Zap size={12} /> High Support Load
          </p>
        </div>

        <div className="relative overflow-hidden group bg-slate-900 p-8 rounded-[32px] text-white shadow-xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Target size={120} />
          </div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Completion Rate</p>
           <h4 className="text-4xl font-black text-white tracking-tighter">{completionRate}%</h4>
          <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Performance Area Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
           <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-500" />
                  Revenue Trajectory
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Last 6 Months Performance</p>
              </div>
           </div>
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height={350}>
                 <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#1e293b' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                      animationDuration={1500}
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Lead Origins Bar Chart */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
           <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Lead Conversion Origins</h4>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={leadSourceData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 'black', fill: '#1e293b', textTransform: 'uppercase'}} 
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                       {leadSourceData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'][index % 4]} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Operational Insights</p>
              <div className="flex justify-between items-center text-xs">
                 <span className="font-bold text-slate-600">Avg. Response Time</span>
                 <span className="font-black text-slate-900">2.4 Hours</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                 <span className="font-bold text-slate-600">Retention Velocity</span>
                 <span className="font-black text-emerald-600">+14% YoY</span>
              </div>
           </div>
        </div>
      </div>

      {/* Recent Activity Ledger */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Global Event Ledger</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Real-time synchronization active</p>
          </div>
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full uppercase tracking-widest flex items-center gap-2">
            <Clock size={12} className="animate-spin-slow" />
            Live Sync
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-5">Entity Email</th>
                <th className="px-10 py-5">Source Name</th>
                <th className="px-10 py-5">Operational Status</th>
                <th className="px-10 py-5">Fulfillment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length > 0 ? (
                leads.slice(0, 5).map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-10 py-5">
                       <span className="text-sm font-bold text-blue-600 decoration-blue-200/50 underline underline-offset-4">{lead.email}</span>
                    </td>
                    <td className="px-10 py-5">
                       <span className="text-sm text-slate-900 font-black tracking-tight">{lead.firstName} {lead.lastName}</span>
                       <span className="text-[10px] text-slate-400 block font-bold uppercase">Via {lead.source}</span>
                    </td>
                    <td className="px-10 py-5">
                       <span className="text-[10px] font-black uppercase tracking-tighter bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                          {lead.status}
                       </span>
                    </td>
                    <td className="px-10 py-5 text-xs text-slate-400 font-black uppercase tracking-widest">
                       {new Date(lead.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Waiting for inbound data streams...</td>
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
