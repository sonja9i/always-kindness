
import React from 'react';
import { Bed, Treatment, TreatmentStatus, TreatmentType } from '../types';
import BedCard from './BedCard';

interface BedGridProps {
  beds: Bed[];
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

const BedGrid: React.FC<BedGridProps> = ({ 
  beds, 
  onAssignPatient, 
  onUpdatePatient, 
  onUpdateMemo, 
  onUpdateArea,
  onDischarge, 
  onUpdateTreatment,
  onAddExtraTreatment,
  onDragTreatmentStart,
  onMoveBedPatient
}) => {
  const firstRow = beds.slice(0, 5);
  const secondRow = beds.slice(5, 10);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {firstRow.map(bed => (
          <BedCard 
            key={bed.id} 
            bed={bed} 
            onAssignPatient={onAssignPatient}
            onUpdatePatient={onUpdatePatient}
            onUpdateMemo={onUpdateMemo}
            onUpdateArea={onUpdateArea}
            onDischarge={onDischarge}
            onUpdateTreatment={onUpdateTreatment}
            onAddExtraTreatment={onAddExtraTreatment}
            onDragTreatmentStart={onDragTreatmentStart}
            onMoveBedPatient={onMoveBedPatient}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {secondRow.map(bed => (
          <BedCard 
            key={bed.id} 
            bed={bed} 
            onAssignPatient={onAssignPatient}
            onUpdatePatient={onUpdatePatient}
            onUpdateMemo={onUpdateMemo}
            onUpdateArea={onUpdateArea}
            onDischarge={onDischarge}
            onUpdateTreatment={onUpdateTreatment}
            onAddExtraTreatment={onAddExtraTreatment}
            onDragTreatmentStart={onDragTreatmentStart}
            onMoveBedPatient={onMoveBedPatient}
          />
        ))}
      </div>
    </div>
  );
};

export default BedGrid;
