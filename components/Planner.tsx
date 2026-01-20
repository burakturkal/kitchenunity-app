
import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  User,
  Eye,
  Edit2,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { PlannerEvent, PlannerEventType, PlannerEventStatus } from '../types';

interface PlannerProps {
  events: PlannerEvent[];
  onAddEvent: () => void;
  onEditEvent: (event: PlannerEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const TYPE_COLORS: Record<PlannerEventType, string> = {
  [PlannerEventType.INSTALL]: 'bg-blue-500',
  [PlannerEventType.DELIVERY]: 'bg-emerald-500',
  [PlannerEventType.MEASUREMENT]: 'bg-amber-500',
  [PlannerEventType.DESIGN]: 'bg-purple-500',
  [PlannerEventType.SERVICE]: 'bg-rose-500',
  [PlannerEventType.INTERNAL]: 'bg-slate-500',
};

const Planner: React.FC<PlannerProps> = ({ events, onAddEvent, onEditEvent, onDeleteEvent }) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border-b border-r border-slate-100 bg-slate-50/30" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      
      days.push(
        <div key={day} className="h-32 border-b border-r border-slate-100 p-2 overflow-y-auto custom-scrollbar group hover:bg-slate-50 transition-colors">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-bold ${day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-400'}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1">
            {dayEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => onEditEvent(event)}
                className={`${TYPE_COLORS[event.type]} text-[9px] text-white font-bold p-1 rounded truncate cursor-pointer hover:brightness-110 transition-all shadow-sm`}
              >
                {event.type.split(' ')[0]}: {event.customerName || 'Internal'}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <CalendarIcon size={14} /> Calendar
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <List size={14} /> List View
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter min-w-[150px] text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <button 
          onClick={onAddEvent}
          className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all"
        >
          <Plus size={18} /> Add Event
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="grid grid-cols-7 bg-slate-900 text-white">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest opacity-80">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-l border-slate-100">
            {renderCalendar()}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Event Type</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Customer</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Address</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length > 0 ? (
                events.sort((a,b) => a.date.localeCompare(b.date)).map(event => (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[event.type]}`} />
                        <span className="text-sm font-bold text-slate-800 tracking-tight">{event.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-slate-600 font-medium">{event.customerName || 'Internal Task'}</td>
                    <td className="px-8 py-4 text-sm font-mono text-slate-500">{event.date}</td>
                    <td className="px-8 py-4 text-sm text-slate-400 font-medium truncate max-w-[200px]">{event.address}</td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                        event.status === PlannerEventStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                        event.status === PlannerEventStatus.CANCELLED ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onEditEvent(event)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors" title="View"><Eye size={18} /></button>
                        <button onClick={() => onEditEvent(event)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors" title="Edit"><Edit2 size={18} /></button>
                        <button onClick={() => onDeleteEvent(event.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors" title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No events scheduled.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Planner;
