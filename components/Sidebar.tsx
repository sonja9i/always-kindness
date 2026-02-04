
import React, { useState, useEffect } from 'react';
import { WaitingPatient, WaitingCategory, DirectorTask } from '../types';

interface SidebarProps {
  waitingList: WaitingPatient[];
  directorTasks: DirectorTask[];
  onAddPatient: (name: string, category: WaitingCategory) => void;
  onRemoveWaitingPatient: (id: string) => void;
  onRemoveDirectorTask: (id: string) => void;
  onDragPatientStart: (e: React.DragEvent, patient: WaitingPatient) => void;
  onAddDirectorTask: (task: DirectorTask) => void;
  onMoveToWaiting: (patient: WaitingPatient) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  waitingList, directorTasks, onAddPatient, onRemoveWaitingPatient, onRemoveDirectorTask, onDragPatientStart, onAddDirectorTask, onMoveToWaiting 
}) => {
  const [nameInput, setNameInput] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatWaitTime = (since: number) => {
    const diff = Math.floor((currentTime - since) / 1000);
    return `${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (type === 'TREATMENT') {
      const data = JSON.parse(e.dataTransfer.getData('payload'));
      if (['침', '추나', '부항'].includes(data.treatmentName)) {
        onAddDirectorTask({ ...data, id: Math.random().toString(36).substr(2, 9), waitingSince: Date.now() });
      } else if (['소노', '충격파'].includes(data.treatmentName)) {
        onAddPatient(data.patientName, data.treatmentName as any);
      }
    }
  };

  return (
    <div className="w-72 h-full bg-white border-r border-slate-200 flex flex-col shadow-lg z-10">
      <div className="p-4 border-b">
        <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <i className="fas fa-user-plus text-emerald-500"></i> 상담/대기 접수
        </div>
        <input 
          type="text" value={nameInput} onChange={e => setNameInput(e.target.value)}
          placeholder="성함 입력" className="w-full px-3 py-2 border rounded-lg mb-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <div className="grid grid-cols-2 gap-1.5">
          {(['상담', '재진', '소노', '충격파'] as WaitingCategory[]).map(cat => (
            <button key={cat} onClick={() => { onAddPatient(nameInput, cat); setNameInput(''); }} className="py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-md hover:bg-emerald-600 hover:text-white transition-all">
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
        {waitingList.map(p => (
          <div key={p.id} draggable onDragStart={e => onDragPatientStart(e, p)} onDragEnd={() => onRemoveWaitingPatient(p.id)} className="p-2.5 bg-white border rounded-lg shadow-sm cursor-move flex items-center justify-between group border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">{p.name}</div>
              <div className="text-[10px] text-slate-400 font-bold">{p.category} | <span className="text-orange-500">{formatWaitTime(p.waitingSince)}</span></div>
            </div>
            <i className="fas fa-times text-slate-300 opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => onRemoveWaitingPatient(p.id)}></i>
          </div>
        ))}
      </div>

      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} className="bg-purple-50 border-t-2 border-purple-200 min-h-[180px]">
        <div className="bg-purple-600 p-2.5 text-white font-bold text-xs flex justify-between">
          <span><i className="fas fa-user-md mr-1"></i>원장 치료 순서</span>
          <span>{directorTasks.length}명 대기</span>
        </div>
        <div className="p-2 space-y-1.5 max-h-[250px] overflow-y-auto">
          {directorTasks.map(task => (
            <div key={task.id} className="p-2 bg-white border border-purple-100 rounded shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1 rounded">{task.bedName}</span>
                <div className="truncate">
                  <span className="text-xs font-bold mr-1">{task.patientName}</span>
                  <span className="text-[10px] text-purple-600 font-bold">[{task.treatmentName}{task.details ? `:${task.details}` : ''}]</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-purple-400">{formatWaitTime(task.waitingSince)}</span>
                <i className="fas fa-check-circle text-purple-300 hover:text-emerald-500 cursor-pointer text-sm" onClick={() => onRemoveDirectorTask(task.id)}></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
