import React from "react";

// Hardcoded patient data
const patients = [
  {
    name: "Joep Doe",
    age: "10 jaar",
    imageUrl:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/9cbc49fe5e5cad6f542ab1afdfa1a584a22b1d760a502af4d81ca29d57f2d10c?apiKey=070967f8f2f74db686d34af20d021ec7&",
  },
  {
    name: "Joep Doe",
    age: "10 jaar",
    imageUrl:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/9cbc49fe5e5cad6f542ab1afdfa1a584a22b1d760a502af4d81ca29d57f2d10c?apiKey=070967f8f2f74db686d34af20d021ec7&",
  },
  {
    name: "Joep Doe",
    age: "10 jaar",
    imageUrl:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/9cbc49fe5e5cad6f542ab1afdfa1a584a22b1d760a502af4d81ca29d57f2d10c?apiKey=070967f8f2f74db686d34af20d021ec7&",
  },
];

interface PatientSelectProps {
  onSelect: () => void;
}

const PatientSelect: React.FC<PatientSelectProps> = ({ onSelect }) => {
  const [showPatients, setShowPatients] = React.useState(false);

  const handleOpenListClick = () => {
    onSelect();
    setShowPatients(!showPatients);
  };

  const addPatientToSession = () => {
    window.location.href = "/activeartssession"; //BAD PRACTICE <3
  };

  return (
    <section className="flex flex-col items-center mt-16">
      <button
        onClick={handleOpenListClick}
        className="flex items-center justify-center w-[553px] h-[76px] rounded-[15px] border border-gray-300 bg-gray-100 text-blue-600 hover:bg-gray-200 focus:outline-none"
      >
        Selecteer patiënt
      </button>
      {showPatients && (
        <ul className="absolute top-20 z-50 w-full max-w-md bg-white border border-gray-300 rounded-lg shadow-lg">
          {patients.map((patient, index) => (
            <li
              key={index}
              className="flex items-center p-4 hover:bg-gray-100"
            >
              <img
                src={patient.imageUrl}
                alt={patient.name}
                className="w-16 h-16 rounded-lg mr-4"
              />
              <div className="flex flex-col flex-grow">
                <span className="font-semibold">{patient.name}</span>
                <span className="text-gray-500">{patient.age}</span>
              </div>
              <button
                onClick={addPatientToSession}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                +
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const ArtsSession: React.FC = () => {
  const handleSelect = () => {
    return;
  };

  return (
    <main className="flex flex-col items-center p-6 text-blue-900">
      <header className="text-4xl font-bold mb-6">Sessie Toevoegen</header>
      <hr className="w-96 h-1 bg-blue-900 mb-4" />
      <h2 className="text-2xl font-semibold mb-6">Patiëntgegevens</h2>
      <PatientSelect onSelect={handleSelect} />
    </main>
  );
};

export { ArtsSession, PatientSelect };
