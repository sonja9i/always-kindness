
import React, { useState, useEffect, useRef } from 'react';
import { Bed, WaitingPatient, Treatment, TreatmentStatus, TreatmentType, DirectorTask } from './types';
import { TREATMENT_DURATIONS, DEFAULT_TREATMENT_NAMES } from './constants';
import Sidebar from './components/Sidebar';
import BedGrid from './components/BedGrid';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";

const App: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingPatient[]>([]);
  const [directorTasks, setDirectorTasks] = useState<DirectorTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 실시간 데이터 구독 (Firestore)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "clinic", "current_status"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBeds(data.beds || []);
        setWaitingList(data.waitingList || []);
        setDirectorTasks(data.directorTasks || []);
      } else {
        // 초기 데이터 세팅
        const initialBeds = [
          { id: 0, name: '특수 물리치료실', patientName: '', area: '', memo: '', treatments: [] },
          ...Array.from({ length: 9 }, (_, i) => ({ id: i + 1, name: `B${i + 1}`, patientName: '', area: '', memo: '', treatments: [] }))
        ];
        setDoc(doc(db, "clinic", "current_status"), { beds: initialBeds, waitingList: [], directorTasks: [] });
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase Error:", error);
      // Fallback: 에러 발생 시 로컬에서 프로젝트 시작 (연동 전 테스트용)
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. 전체 상태 업데이트 함수 (Firebase 저장)
  const syncWithFirebase = async (newBeds: Bed[], newWaiting?: WaitingPatient[], newTasks?: DirectorTask[]) => {
    try {
      await updateDoc(doc(db, "clinic", "current_status"), {
        beds: newBeds,
        waitingList: newWaiting || waitingList,
        directorTasks: newTasks || directorTasks
      });
    } catch (e) { console.error("Sync Error:", e); }
  };

  // 3. 타이머 로직 (로컬에서만 계산, 서버 부하 방지)
  useEffect(() => {
    const interval = setInterval(() => {
      setBeds((prevBeds) => {
        let changed = false;
        const nextBeds = prevBeds.map((bed) => {
          let hasFinished = false;
          const newTreatments = bed.treatments.map((t) => {
            if (t.status === '진행중') {
              if (t.name === '추나') return { ...t, elapsedTime: t.elapsedTime + 1 };
              
              if (t.targetEndTime) {
                const remaining = Math.max(0, Math.floor((t.targetEndTime - Date.now()) / 1000));
                if (remaining !== t.timeLeft) {
                  changed = true;
                  if (remaining === 0 && t.timeLeft > 0) hasFinished = true;
                  return { ...t, timeLeft: remaining, status: remaining === 0 ? '완료' : '진행중' };
                }
              }
            }
            return t;
          });

          if (hasFinished) {
            playAlarm();
            return { ...bed, treatments: newTreatments, isAlarming: true };
          }
          return { ...bed, treatments: newTreatments };
        });
        return changed ? nextBeds : prevBeds;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const playAlarm = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});
  };

  const createDefaultTreatments = (name: string, isSpecial: boolean): Treatment[] => {
    if (isSpecial) {
      return (['소노', '충격파'] as TreatmentType[]).map(tName => ({
        id: Math.random().toString(36).substr(2, 9),
        name: tName, status: '대기', timeLeft: TREATMENT_DURATIONS[tName], elapsedTime: 0, duration: TREATMENT_DURATIONS[tName], isDefault: true,
      }));
    }
    return DEFAULT_TREATMENT_NAMES.map(tName => ({
      id: Math.random().toString(36).substr(2, 9),
      name: tName, status: '대기', timeLeft: TREATMENT_DURATIONS[tName], elapsedTime: 0, duration: TREATMENT_DURATIONS[tName], isDefault: true,
    }));
  };

  const handleDischarge = (bedId: number) => {
    const newBeds = beds.map(b => b.id === bedId ? { ...b, patientName: '', area: '', memo: '', treatments: [], isAlarming: false } : b);
    const newTasks = directorTasks.filter(t => t.bedId !== bedId);
    syncWithFirebase(newBeds, waitingList, newTasks);
  };

  const updateTreatment = (bedId: number, treatmentId: string, updates: Partial<Treatment>) => {
    const newBeds = beds.map(bed => {
      if (bed.id === bedId) {
        let newTreatments = bed.treatments.map(t => {
          if (t.id === treatmentId) {
            let nextUpdates = { ...updates };
            if (updates.status === '진행중') {
              const duration = updates.duration || t.duration;
              nextUpdates.targetEndTime = Date.now() + (duration * 1000);
              nextUpdates.timeLeft = duration;
            }
            return { ...t, ...nextUpdates };
          }
          return t;
        }).filter(t => !(t.status === '안함' && !t.isDefault));
        
        newTreatments.sort((a, b) => {
          const score = { '진행중': 0, '대기': 1, '완료': 2, '안함': 3 };
          return score[a.status] - score[b.status];
        });
        return { ...bed, treatments: newTreatments };
      }
      return bed;
    });
    syncWithFirebase(newBeds);
  };

  const movePatientAndTreatment = (fromBedId: number, toBedId: number, patientName: string, specificTreatment?: Treatment) => {
    const fromBed = beds.find(b => b.id === fromBedId);
    const newBeds = beds.map(bed => {
      if (bed.id === toBedId) {
        const isSpecial = toBedId === 0;
        let newTreatments = bed.patientName ? [...bed.treatments] : createDefaultTreatments(patientName, isSpecial);
        if (specificTreatment) {
          if (!newTreatments.some(t => t.name === specificTreatment.name)) {
            newTreatments.push({ ...specificTreatment, id: Math.random().toString(36).substr(2, 9), status: '대기' });
          }
        }
        return { ...bed, patientName: bed.patientName || patientName, treatments: newTreatments, memo: bed.memo || fromBed?.memo || '', area: bed.area || fromBed?.area || '' };
      }
      if (bed.id === fromBedId) {
        if (specificTreatment) {
          const remaining = bed.treatments.filter(t => t.id !== specificTreatment.id);
          return remaining.length === 0 ? { ...bed, patientName: '', area: '', memo: '', treatments: [], isAlarming: false } : { ...bed, treatments: remaining };
        }
        return { ...bed, patientName: '', area: '', memo: '', treatments: [], isAlarming: false };
      }
      return bed;
    });
    syncWithFirebase(newBeds);
  };

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-bold text-slate-400">데이터 연결 중...</div>;

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
      <Sidebar 
        waitingList={waitingList} directorTasks={directorTasks}
        onAddPatient={(name, category) => syncWithFirebase(beds, [...waitingList, { id: Date.now().toString(), name, category, waitingSince: Date.now() }])}
        onRemoveWaitingPatient={id => syncWithFirebase(beds, waitingList.filter(p => p.id !== id))}
        onRemoveDirectorTask={id => {
          const task = directorTasks.find(t => t.id === id);
          if (task) updateTreatment(task.bedId, task.treatmentId, { status: '진행중' });
          syncWithFirebase(beds, waitingList, directorTasks.filter(t => t.id !== id));
        }}
        onDragPatientStart={(e, p) => { e.dataTransfer.setData('type', 'PATIENT'); e.dataTransfer.setData('patientName', p.name); }}
        onAddDirectorTask={task => syncWithFirebase(beds, waitingList, [...directorTasks, { ...task, id: Math.random().toString(36).substr(2, 9), waitingSince: Date.now() }])}
        onMoveToWaiting={(patient) => syncWithFirebase(beds, [...waitingList, patient])}
      />

      <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <header className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
             <div className="bg-[#834133] p-2 rounded-lg text-white"><i className="fas fa-clinic-medical"></i></div>
             <h1 className="text-xl font-bold text-slate-800">진료실 통합 현황판</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-[11px] font-bold text-blue-700">전체 기기 실시간 동기화 중</span>
             </div>
          </div>
        </header>

        <BedGrid 
          beds={beds}
          onAssignPatient={(id, name) => {
            const newBeds = beds.map(b => b.id === id ? { ...b, patientName: name, treatments: createDefaultTreatments(name, id === 0) } : b);
            syncWithFirebase(newBeds);
          }}
          onUpdatePatient={(id, name) => {
            const newBeds = beds.map(b => b.id === id ? { ...b, patientName: name, treatments: name ? createDefaultTreatments(name, id === 0) : [] } : b);
            syncWithFirebase(newBeds);
          }}
          onUpdateMemo={(id, memo) => {
            const newBeds = beds.map(b => b.id === id ? { ...b, memo } : b);
            syncWithFirebase(newBeds);
          }}
          onUpdateArea={(id, area) => {
            const newBeds = beds.map(b => b.id === id ? { ...b, area } : b);
            syncWithFirebase(newBeds);
          }}
          onDischarge={handleDischarge}
          onUpdateTreatment={updateTreatment}
          onAddExtraTreatment={(id, name) => {
            const newBeds = beds.map(b => {
              if (b.id === id && !b.treatments.some(t => t.name === name)) {
                return { ...b, treatments: [...b.treatments, { id: Math.random().toString(36).substr(2, 9), name, status: '대기', timeLeft: TREATMENT_DURATIONS[name], duration: TREATMENT_DURATIONS[name], elapsedTime: 0, isDefault: false }] };
              }
              return b;
            });
            syncWithFirebase(newBeds);
          }}
          onDragTreatmentStart={(e, t, bId, bName, pName) => {
              e.dataTransfer.setData('type', 'TREATMENT');
              e.dataTransfer.setData('payload', JSON.stringify({ bedId: bId, bedName: bName, patientName: pName, treatmentName: t.name, treatmentId: t.id, treatmentData: t }));
          }}
          onMoveBedPatient={movePatientAndTreatment}
        />
      </main>
    </div>
  );
};

export default App;
