import React from "react";
import { logout } from "../services/auth";
import { useNavigate } from "react-router-dom";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="fixed left-0 top-0 w-[265px] bg-[#e8edf8] flex flex-col h-screen p-5 box-border rounded-tl-lg rounded-bl-lg z-40">
      {/* Logo Section */}
      <div className="flex items-center justify-center mb-4">
        <img
          src="/Images/JDBLogo.png"
          className="h-[65px] object-contain"
          alt="JDB Logo"
        />
      </div>

      {/* Navigation */}
      <nav>
        <ul className="list-none p-0">
          <li className="flex items-center mb-4">
            <img src="/Icons/Dashboard.svg" alt="Dashboard" className="w-8 h-8 mr-4" />
            <a href="/dashboard" className="text-black no-underline hover:font-bold">
              Dashboard
            </a>
          </li>
          <li className="flex items-center mb-4">
            <img src="/Icons/Calendar.svg" alt="Kalender" className="w-8 h-8 mr-4" />
            <a href="/kalender" className="text-black no-underline hover:font-bold">
              Kalender
            </a>
          </li>
          <li className="flex items-center mb-4">
            <img src="/Icons/Documents.svg" alt="Notities" className="w-8 h-8 mr-4" />
            <a href="/notes" className="text-black no-underline hover:font-bold">
              Notities
            </a>
          </li>
          <li className="flex items-center mb-4">
            <img src="/Icons/Patients.svg" alt="Patiëntenoverzicht" className="w-8 h-8 mr-4" />
            <a href="/patients" className="text-black no-underline hover:font-bold">
              Patiëntenoverzicht
            </a>
          </li>
        </ul>

        <hr className="border-t-2 border-[#d0d5dd] my-5" />

        <ul className="list-none p-0">
          <li className="flex items-center mb-4">
            <img src="/Icons/Plus.svg" alt="Afspraak toevoegen" className="w-8 h-8 mr-4" />
            <span className="text-black">Afspraak toevoegen</span>
          </li>
          <li className="flex items-center mb-4">
            <img src="/Icons/Graph.svg" alt="Sessie toevoegen arts" className="w-8 h-8 mr-4" />
            <a href="/artsession" className="text-black no-underline hover:font-bold">
              Sessie toevoegen arts
            </a>
          </li>
          <li className="flex items-center mb-4">
            <img src="/Icons/Graph.svg" alt="Sessie toevoegen fysiotherapeut" className="w-8 h-8 mr-4" />
            <a href="/physiosession" className="text-black no-underline hover:font-bold">
              Sessie toevoegen fysiotherapeut
            </a>
          </li>
        </ul>

        <hr className="border-t-2 border-[#d0d5dd] my-5" />
      </nav>

      {/* Role Indicator */}
      <div className="mb-4 p-3 bg-blue-100 rounded-lg">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-blue-800">Dokter Modus</span>
        </div>
      </div>

      {/* Settings and Logout */}
      <div className="mt-auto">
        <ul className="list-none p-0">
          <li className="flex items-center mb-4">
            <img src="/Icons/Settings.svg" alt="Instellingen" className="w-8 h-8 mr-4" />
            <a href="/settings" className="text-black no-underline hover:font-bold">
              Instellingen
            </a>
          </li>
          <li className="flex items-center cursor-pointer" onClick={handleLogout}>
            <img src="/Icons/Logout.svg" alt="Uitloggen" className="w-8 h-8 mr-4" />
            <span className="text-black hover:font-bold">
              Uitloggen
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
