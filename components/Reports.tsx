
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Lead, Order, Claim } from '../types';
import { TrendingUp, Users, AlertCircle, DollarSign, Target } from 'lucide-react';

interface ReportsProps {
  leads: Lead[];
  orders: Order[];
  claims: Claim[];
}

const Reports: React.FC<ReportsProps> = ({ leads, orders, claims }) => {
  // Aggregate revenue by month
  const revenueByMonth = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ name: m, revenue: 0, count: 0 }));
    
    orders.forEach(o => {
      const monthIndex = new Date(o.createdAt).getMonth();
      data[monthIndex].revenue += o.amount;
      data[monthIndex].count += 1;
    });
    return data;
  }, [orders]);

  // Lead Source Distribution
  const leadSourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    leads.forEach(l => {
      const s = l.source || 'Direct';
      sources[s] = (sources[s] || 0) + 1;
    });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Claim Status Distribution
  const claimStatusData = useMemo(() => {
    const statuses: Record<string, number> = {};
    claims.forEach(c => {
      statuses[c.status] = (statuses[c.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [claims]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">BI Analytics</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Enterprise performance intelligence</p>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Avg Order Value', value: orders.length ? `$${(orders.reduce((a,b)=>a+b.amount, 0)/orders.length).toFixed(0)}` : '$0', icon: DollarSign, color: 'blue' },
          { label: 'Lead Conversion', value: leads.length ? `${((orders.length/leads.length)*100).toFixed(1)}%` : '0%', icon: Target, color: 'indigo' },
          { label: 'Retention Rate', value: '94%', icon: Users, color: 'emerald' },
          { label: 'Support Pressure', value: claims.length, icon: AlertCircle, color: 'rose' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
             <div className={`w-10 h-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center mb-6`}>
               <stat.icon size={20} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
             <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
             <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
               <TrendingUp size={16} className="text-blue-500" />
               Gross Revenue Performance
             </h4>
             <div className="flex gap-2">
               <span className="w-3 h-3 bg-blue-500 rounded-full" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue (USD)</span>
             </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-xl space-y-8">
           <h4 className="text-sm font-black uppercase tracking-widest text-blue-400">Inquiry Origin Distribution</h4>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="pt-6 border-t border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Conversion by Source</p>
              <div className="space-y-3">
                 {leadSourceData.map((d, i) => (
                   <div key={i} className="flex justify-between items-center">
                      <span className="text-xs font-bold">{d.name}</span>
                      <span className="text-xs font-black text-blue-400">{((d.value/leads.length)*100).toFixed(0)}%</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

import { useMemo } from 'react';
export default Reports;
