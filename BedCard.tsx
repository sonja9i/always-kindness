
import React from 'react';
import { Bed, Treatment, TreatmentStatus, TreatmentType } from '../types';
import TreatmentItem from './TreatmentItem';

interface BedCardProps {
  bed: Bed;
  onAssignPatient: (bedId: number, patientName: string) => void;
  onUpdatePatient: (bedId: number, name: string) => void;
  onUpdateMemo: (bedId: number, memo: string) => void;
  onUpdateArea: (bedId: number, area: string) => void;
  onDischarge: (bedId: number) => void;
  onUpdateTreatment: (bedId: number, treatmentId: string, updates: Partial<Treatment>) => void;
  onAddExtraTreatment: (bedId: number, name: TreatmentType) => void;
  onDragTreatmentStart: (e: React.DragEvent, treatment: Treatment, bedId: number, bedName: string, patientName: string) => void;
  onMoveBedPatient: (fromBedId: number, toBedId: number, patientName: string, specificTreatment?: Treatment) => void;
}

const BedCard: React.FC<BedCardProps> = ({ 
  bed, onAssignPatient, onUpdatePatient, onUpdateMemo, onUpdateArea, onDischarge, onUpdateTreatment, onAddExtraTreatment, onDragTreatmentStart, onMoveBedPatient
}) => {
  const isEmpty = !bed.patientName;
  const isSpecial = bed.id === 0;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    
    if (type === 'PATIENT') {
      onAssignPatient(bed.id, e.dataTransfer.getData('patientName'));
    } else if (type === 'TREATMENT') {
      const payloadString = e.dataTransfer.getData('payload');
      if (payloadString) {
        const payload = JSON.parse(payloadString);
        if (payload.bedId !== bed.id) {
          // 특수 치료실(ID: 0)이 출발지거나 목적지인 경우에만 이동 허용
          if (payload.bedId === 0 || bed.id === 0) {
            onMoveBedPatient(payload.bedId, bed.id, payload.patientName, payload.treatmentData);
          }
        }
      }
    } else if (type === 'BED_MOVE') {
      const fromBedId = parseInt(e.dataTransfer.getData('fromBedId'));
      const patientName = e.dataTransfer.getData('patientName');
      if (fromBedId !== bed.id) {
        // 특수 치료실(ID: 0)이 출발지거나 목적지인 경우에만 이동 허용
        if (fromBedId === 0 || bed.id === 0) {
          onMoveBedPatient(fromBedId, bed.id, patientName);
        }
      }
    }
  };

  const handleDragBedStart = (e: React.DragEvent) => {
    if (isEmpty) return;
    e.dataTransfer.setData('type', 'BED_MOVE');
    e.dataTransfer.setData('fromBedId', bed.id.toString());
    e.dataTransfer.setData('patientName', bed.patientName);
  };

  return (
    <div 
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      className={`relative min-h-[520px] flex flex-col bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 overflow-hidden ${
        isEmpty ? 'border-dashed border-slate-200 opacity-80' : bed.isAlarming ? 'border-rose-500 animate-pulse ring-4 ring-rose-100' : 'border-slate-100 shadow-lg'
      }`}
    >
      {/* Bed Header */}
      <div 
        draggable={!isEmpty}
        onDragStart={handleDragBedStart}
        className={`p-3.5 flex items-center justify-between cursor-move ${
          isEmpty ? 'bg-slate-50' : 'bg-[#834133] text-white shadow-inner'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${isEmpty ? 'bg-slate-200 text-slate-500' : 'bg-black/20 text-white'}`}>
            {isSpecial ? '특수' : `B ${bed.id}`}
          </span>
          {!isEmpty && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-bold truncate">{bed.patientName}</span>
              <div className="flex items-center border-l border-white/20 pl-2 ml-1">
                <span className="text-[10px] text-white/60 mr-1 font-medium">부위</span>
                <input 
                  type="text" value={bed.area || ''} placeholder="입력"
                  onChange={e => onUpdateArea(bed.id, e.target.value)}
                  className="bg-white/10 text-white text-[11px] px-1.5 py-0.5 rounded border-none w-14 focus:ring-1 focus:ring-white/40 placeholder-white/30"
                />
              </div>
            </div>
          )}
        </div>
        {!isEmpty && <button onClick={() => onDischarge(bed.id)} className="text-[10px] font-bold bg-[#B94B3C] hover:bg-[#A03A2D] px-2.5 py-1.5 rounded-lg transition-colors ml-2 shadow-sm">퇴실</button>}
      </div>

      <div className="flex-1 p-3 flex flex-col gap-3 relative">
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-50/30">
             <i className="fas fa-user-edit text-5xl mb-6 text-slate-200"></i>
             <div className="w-full text-center">
                <label className="block text-[11px] font-bold text-slate-400 mb-2">환자 성함 입력</label>
                <input 
                  type="text" 
                  placeholder="환자명 입력..."
                  className="bg-white text-base font-black border-2 border-slate-100 rounded-2xl px-3 py-4 w-full text-center focus:border-emerald-500 focus:ring-0 outline-none placeholder-slate-200 transition-all shadow-md"
                  onKeyDown={e => { if (e.key === 'Enter') onUpdatePatient(bed.id, (e.target as HTMLInputElement).value); }}
                />
                <span className="block mt-3 text-[10px] text-slate-300 font-medium tracking-tight">엔터를 누르면 입실됩니다</span>
             </div>
          </div>
        ) : (
          <>
            <div className="relative group">
              <i className="fas fa-bolt absolute left-3 top-2.5 text-amber-400 text-xs"></i>
              <textarea 
                value={bed.memo} onChange={e => onUpdateMemo(bed.id, e.target.value)}
                placeholder="환자 특이사항/메모 입력..." 
                className="w-full h-14 bg-[#FEF9EC] text-[11px] pl-8 pr-3 py-2.5 rounded-xl border-none focus:ring-1 focus:ring-amber-200 text-slate-700 resize-none placeholder-amber-300 font-medium"
              />
            </div>

            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1">
              {bed.treatments.map(t => (
                <TreatmentItem 
                  key={t.id} 
                  treatment={t} 
                  onUpdate={upd => onUpdateTreatment(bed.id, t.id, upd)} 
                  onDragStart={e => onDragTreatmentStart(e, t, bed.id, bed.name, bed.patientName)} 
                />
              ))}
            </div>

            <div className="pt-2 border-t border-slate-50 flex flex-wrap gap-1 justify-center">
              {isSpecial ? (
                <>
                  <button onClick={() => onAddExtraTreatment(bed.id, '소노')} className="text-[10px] font-bold px-3 py-2 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg hover:bg-slate-800 hover:text-white transition-all">+ 소노</button>
                  <button onClick={() => onAddExtraTreatment(bed.id, '충격파')} className="text-[10px] font-bold px-3 py-2 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg hover:bg-slate-800 hover:text-white transition-all">+ 충격파</button>
                </>
              ) : (
                (['Ice', '추나', '소노', '충격파'] as TreatmentType[]).map(type => (
                  <button key={type} onClick={() => onAddExtraTreatment(bed.id, type)} className="text-[10px] font-bold px-2.5 py-2 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg hover:bg-slate-800 hover:text-white transition-all">
                    + {type}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BedCard;
