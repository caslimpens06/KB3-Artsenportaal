// !! Momenteel niet in gebruik !!
import React from 'react';
import { Visit, Patient } from '../abstracts/ImportsModels';

interface PatientVisitsProps {
  patient: Patient;
}

const PatientVisits: React.FC<PatientVisitsProps> = ({ patient }) => {
  const visits = patient.Visits;
  const handleVisitClick = (visit: Visit) => {
    console.log('Visit clicked:', visit);
  };

  return (
    <div className="border-8 border-blue-100 bg-[#D8EAFF] p-4 mx-auto rounded-2xl w-4/5 max-h-[500px] overflow-y-auto">
      <h4 className="text-left px-4 py-2 text-[#000369] text-black underline">Alle bezoeken</h4>
      <div className="flex justify-between px-4 text-[#000369] w-11/12">
        <div>Bezoeken overzicht</div>
      </div>
      <div className="space-y-2">
        {visits.map((visit: Visit) => (
          <div
            key={visit.Id}
            className="flex justify-between items-center p-3 bg-white mb-2 rounded-lg cursor-pointer hover:bg-blue-200"
            onClick={() => handleVisitClick(visit)}
          >
            <div className="grid grid-cols-3 gap-4 w-full text-black">
              <div>{`${visit.Date}`}</div>
              <div>{visit.Patient}</div>
              <div>{visit.Diagnosis}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientVisits;
