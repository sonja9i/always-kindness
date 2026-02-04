
import React, { useState } from 'react';
import { Treatment, TreatmentStatus, TreatmentType } from '../types';
import { ACUPUNCTURE_TYPES, HOTPACK_TYPES } from '../constants';

interface TreatmentItemProps {
  treatment: Treatment;
  onUpdate: (updates: Partial<Treatment>) => void;
  onDragStart: (e: React.DragEvent) => void;
}

const TreatmentItem: React.FC<TreatmentItemProps> = ({ treatment, onUpdate, onDragStart }) => {
  const [showControls, setShowControls] = useState(treatment.status === '대기');

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusStyle = () => {
    switch (treatment.status) {
      case '진행중': return 'bg-[#00A37E] text-white border-[#008F6E] shadow-md'; 
      case '완료': return 'bg-[#769DE6] text-white border-[#6389D1]'; 
      case '안함': return 'bg-[#333333] text-white border-black opacity-80'; 
      default: return 'bg-white border-slate-200 text-slate-800 shadow-sm';
    }
  };

  const handleStatusChange = (status: TreatmentStatus) => {
    onUpdate({ status });
    if (status === '진행중') setShowControls(false);
  };

  const isAreaTreatment = ['ICT', '소노', '충격파'].includes(treatment.name);

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onClick={() => setShowControls(!showControls)}
      className={`group p-2.5 rounded-xl border transition-all duration-200 mb-1.5 select-none relative ${getStatusStyle()} ${
        treatment.status === '대기' ? 'hover:border-emerald-400 cursor-pointer scale-[0.98] hover:scale-100' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="flex flex-col gap-1">
        {/* 상단 라인: 이름 + 세부옵션(괄호) + 입력창 + 상태버튼 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="text-[14px] font-black shrink-0">{treatment.name}</span>
            
            {/* 세부 옵션 표시 (괄호 형식) - 컨트롤이 닫혀있을 때만 표시 */}
            {!showControls && (
              <div className="flex items-center gap-1 truncate">
                {/* 부위 표시 (ICT, 소노, 충격파) */}
                {treatment.area && (
                  <span className="text-[13px] font-black text-amber-200 truncate">({treatment.area})</span>
                )}
                {/* 침 종류 표시 */}
                {treatment.name === '침' && treatment.acupunctureType && (
                  <span className="text-[13px] font-black text-sky-200 truncate">({treatment.acupunctureType})</span>
                )}
                {/* 핫팩 종류 표시 */}
                {treatment.name === '핫팩' && treatment.hotPackType && (
                  <span className="text-[13px] font-black text-amber-100 truncate">
                    ({treatment.hotPackType}{treatment.hotPackMemo ? `:${treatment.hotPackMemo}` : ''})
                  </span>
                )}
                {/* 습부항 표시 */}
                {treatment.name === '부항' && treatment.isWet && (
                  <span className="text-[13px] font-black text-rose-300 ml-0.5">(습부)</span>
                )}
              </div>
            )}

            {/* 입력창 (편집 모드일 때만 명칭 바로 옆에 배치) */}
            {showControls && (
              <>
                {isAreaTreatment && (
                  <input 
                    type="text" 
                    placeholder="부위" 
                    value={treatment.area || ''}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                    onChange={e => onUpdate({ area: e.target.value })}
                    className="text-[12px] flex-1 min-w-[50px] px-2 py-1 bg-white/20 border border-white/30 rounded focus:bg-white focus:text-slate-800 outline-none font-bold placeholder-white/50 text-white"
                  />
                )}
                {treatment.name === '부항' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onUpdate({ isWet: !treatment.isWet }); }}
                    className={`text-[10px] px-1.5 py-1 rounded font-black border transition-all shrink-0 ${treatment.isWet ? 'bg-rose-500 text-white border-rose-600' : 'bg-white/20 text-white border-white/30'}`}
                  >
                    습부항
                  </button>
                )}
              </>
            )}

            {/* 타이머 표시 */}
            {treatment.status === '진행중' && (
               <div className="flex items-center gap-1 ml-auto shrink-0">
                 <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
                 <span className="text-[13px] font-mono font-black">
                   {treatment.name === '추나' ? `+ ${formatTime(treatment.elapsedTime)}` : formatTime(treatment.timeLeft)}
                 </span>
               </div>
            )}
          </div>

          {/* 상태 변경 버튼 */}
          {showControls ? (
            <div className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => handleStatusChange('진행중')} className="text-[9px] bg-[#00A37E] text-white px-2 py-1 rounded font-black border border-emerald-700">시작</button>
              <button onClick={() => handleStatusChange('완료')} className="text-[9px] bg-[#769DE6] text-white px-2 py-1 rounded font-black border border-sky-700">완료</button>
              <button onClick={() => handleStatusChange('안함')} className="text-[9px] bg-[#333333] text-white px-2 py-1 rounded font-black border border-black">안함</button>
            </div>
          ) : (
            <div className={`text-[10px] font-black shrink-0 ${treatment.status === '대기' ? 'text-slate-400' : 'text-white/80'}`}>
              {treatment.status === '대기' ? '대기' : ''}
            </div>
          )}
        </div>

        {/* 하단 상세 옵션 선택창 */}
        {showControls && (
          <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-black/5" onClick={e => e.stopPropagation()}>
            {(treatment.name === '소노' || treatment.name === '충격파') && (
              <div className="flex gap-1 w-full">
                {[330, 600].map(time => (
                  <button 
                    key={time}
                    onClick={() => onUpdate({ duration: time, timeLeft: time })}
                    className={`flex-1 text-[10px] py-1 rounded border font-black ${treatment.duration === time ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    {time === 330 ? '5:30' : '10:00'}
                  </button>
                ))}
              </div>
            )}

            {treatment.name === '침' && (
              <div className="grid grid-cols-3 gap-1 w-full">
                {ACUPUNCTURE_TYPES.map(type => (
                  <button key={type} onClick={() => onUpdate({ acupunctureType: treatment.acupunctureType === type ? '' : type })} className={`text-[9px] py-1 rounded border truncate font-bold ${treatment.acupunctureType === type ? 'bg-sky-600 text-white border-sky-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{type}</button>
                ))}
              </div>
            )}

            {treatment.name === '핫팩' && (
              <div className="w-full space-y-1.5">
                <div className="grid grid-cols-3 gap-1">
                  {HOTPACK_TYPES.map(type => (
                    <button key={type} onClick={() => onUpdate({ hotPackType: treatment.hotPackType === type ? '' : type })} className={`text-[9px] py-1 rounded border font-bold ${treatment.hotPackType === type ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{type}</button>
                  ))}
                </div>
                {(treatment.hotPackType === '자기장' || treatment.hotPackType === '두타베드') && (
                  <input 
                    type="text" placeholder="장비 메모..." value={treatment.hotPackMemo || ''}
                    onChange={e => onUpdate({ hotPackMemo: e.target.value })}
                    className="text-[10px] w-full px-2 py-1 bg-amber-50 border border-amber-100 rounded text-slate-800 outline-none font-bold"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentItem;
