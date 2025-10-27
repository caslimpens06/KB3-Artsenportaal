import React from "react";
import { Patient } from "../abstracts/ImportsModels";

type ContactPerson = {
  Phonenumber: string;
  Email: string;
};

interface PatientDetailsProps {
  patient: Patient;
}

const PatientDetails: React.FC<PatientDetailsProps> = ({ patient }) => {
  const contactPerson: ContactPerson = {
    Phonenumber: patient.PhonenumberContact,
    Email: patient.EmailContact,
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="bg-white border-8 border-blue-200 rounded-2xl p-6 m-4 max-w-4xl w-full shadow-md">
        <div className="bg-white rounded-2xl p-6 mb-6 text-blue-900">
          <h2 className="text-2xl font-bold mb-4">Patiënt</h2>
          <div className="grid gap-4">
            <div className="flex flex-col">
              <span className="font-bold">Naam:</span>
              <span id="patient-name" className="text-gray-700">{`${patient.Firstname} ${patient.Lastname}`}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold">Email:</span>
              <span id="patient-email" className="text-gray-700">{patient.Email}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold">Leeftijd:</span>
              <span id="patient-age" className="text-gray-700">{patient.Age}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold">Telefoonnummer:</span>
              <span id="patient-phonenumber" className="text-gray-700">{patient.Phonenumber}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold">Geslacht:</span>
              <span id="patient-sex" className="text-gray-700">{patient.Sex}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-6 text-blue-900">
          <h2 className="text-2xl font-bold mb-4">Contactpersoon</h2>
          <div className="grid gap-4">
            <div className="flex flex-col">
              <span className="font-bold">Telefoonnummer:</span>
              <span id="contactperson-phonenumber" className="text-gray-700">{contactPerson.Phonenumber}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold">E-mailadres:</span>
              <span id="contactperson-email" className="text-gray-700">{contactPerson.Email}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 text-blue-900">
          <h2 className="text-2xl font-bold mb-4">Medicatie</h2>
          <div className="grid gap-4">
            <div className="flex flex-col">
              <span className="font-bold">Medicijn:</span>
              <span className="text-gray-700">Gebruik</span>
            </div>
            {/* Add more medication details as needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;