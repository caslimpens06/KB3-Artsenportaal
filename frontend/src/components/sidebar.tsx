import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";

export interface SidebarProps {
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarExpanded, toggleSidebar }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div
            className={`fixed left-0 top-0 h-screen flex flex-col rounded-tl-lg rounded-bl-lg z-40
      transition-all duration-300 ease-in-out
      ${sidebarExpanded ? "w-[265px] bg-blue-100 p-5" : "w-24 bg-[#e8edf8] p-2"}`}
        >
            <div
                className="absolute top-4 left-4 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md z-50"
                onClick={toggleSidebar}
            >
                <svg
                    className={`w-5 h-5 transition-transform duration-300 ${sidebarExpanded ? "" : "rotate-180"
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </div>

            <div
                className={`flex items-center justify-center mb-4 transition-opacity duration-300 ${sidebarExpanded ? "opacity-100" : "opacity-0"
                    }`}
            >
                <img src="/Images/JDBLogo.png" className="h-[65px] object-contain" alt="JDB Logo" />
            </div>

            <nav className="flex-1">
                <ul className="list-none p-0">
                    {[
                        { icon: "/Icons/Dashboard.svg", label: "Dashboard", href: "/dashboard" },
                        { icon: "/Icons/Calendar.svg", label: "Alle Afspraken", href: "/kalender" },
                        { icon: "/Icons/Documents.svg", label: "Alle Notities", href: "/notes" },
                        { icon: "/Icons/Patients.svg", label: "Patiëntenoverzicht", href: "/patients" },
                    ].map((item) => (
                        <li key={item.label} className="flex items-center mb-4">
                            <img src={item.icon} alt={item.label} className="w-8 h-8 mr-4" />
                            <a
                                href={item.href}
                                className={`text-black no-underline hover:font-bold transition-all duration-300 truncate ${sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                                    }`}
                                title={item.label}
                            >
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
                <hr
                    className={`border-t-2 border-[#d0d5dd] my-5 transition-opacity duration-300 ${sidebarExpanded ? "opacity-100" : "opacity-0"
                        }`}
                />
            </nav>

            <div
                className={`mb-4 p-3 bg-blue-200 rounded-lg transition-colors duration-300 ${sidebarExpanded ? "opacity-100" : "opacity-0"
                    }`}
            >
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-blue-800">Dokter Modus</span>
                </div>
            </div>

            <div className="mt-auto">
                <ul className="list-none p-0">
                    <li className="flex items-center mb-4">
                        <img src="/Icons/Settings.svg" alt="Instellingen" className="w-8 h-8 mr-4" />
                        <a
                            href="/settings"
                            className={`text-black no-underline hover:font-bold transition-all duration-300 truncate ${sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                                }`}
                            title="Instellingen"
                        >
                            Instellingen
                        </a>
                    </li>
                    <li className="flex items-center cursor-pointer" onClick={handleLogout}>
                        <img src="/Icons/Logout.svg" alt="Uitloggen" className="w-8 h-8 mr-4" />
                        <span
                            className={`text-black hover:font-bold transition-all duration-300 truncate ${sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                                }`}
                            title="Uitloggen"
                        >
                            Uitloggen
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
