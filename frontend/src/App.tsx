import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import AboutUsPage from "./pages/aboutuspage";
import PatientPage from "./pages/patientpage";
import ArtsPage from "./pages/artspage";
import DashboardPage from "./pages/dashboardpage";
import PatientOverview, { PatientSearch } from "./pages/patientoverview";
import Sidebar from "./components/sidebar";
import ResearchSidebar from "./components/researchsidebar";
import LoginPage from "./pages/loginpage";
import NotFoundPage from "./pages/notfoundpage";
import Notes from "./pages/notes";
import SettingsPage from "./pages/settingspage";
import { ArtsSession } from "./pages/artssessionpage";
import PhysioSessionPage from "./pages/physiosessionpage";
import { ActiveArtsSession } from "./pages/activeartssessionpage";
import CalenderPage from "./pages/calendarpage";
import ResetPasswordPage from "./pages/resetpasswordpage";
import MeasurementsPage from "./pages/measurementspage";
import TestStrapiPage from "./pages/teststrapipage";
import OnderzoeksDashboard from "./pages/onderzoeksdashboard";
import CMASAnalyse from "./pages/cmasanalyse";
import Labresultaten from "./pages/labresultaten";
import ProtectedRoute from "./components/ProtectedRoute";
import { isAuthenticated, isDoctor, isResearcher } from "./services/auth";

const App: React.FC = () => {
    const [hideNavbar, setHideNavbar] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);

    const toggleSidebar = () => setSidebarExpanded(prev => !prev);

    const renderSidebar = () => {
        if (hideNavbar || !isAuthenticated()) return null;
        if (isResearcher()) return <ResearchSidebar sidebarExpanded={sidebarExpanded} toggleSidebar={toggleSidebar} />;
        return <Sidebar sidebarExpanded={sidebarExpanded} toggleSidebar={toggleSidebar} />;
    };

    const getDefaultRedirect = () => {
        if (!isAuthenticated()) return <Navigate to="/login" replace />;
        if (isResearcher()) return <Navigate to="/onderzoek-dashboard" replace />;
        if (isDoctor()) return <Navigate to="/dashboard" replace />;
        return <Navigate to="/login" replace />;
    };

    return (
        <Router>
            <div className="flex min-h-screen">
                <div className={`transition-all duration-300 ${sidebarExpanded ? 'w-64' : 'w-24'}`}>
                    {renderSidebar()}
                </div>
                <div className="flex-1 transition-all duration-300">
                    <Routes>
                        <Route path="/" element={getDefaultRedirect()} />
                        <Route path="/login" element={<LoginPage setHideNavbar={setHideNavbar} />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage setHideNavbar={setHideNavbar} />} />
                        <Route path="/aboutus" element={<ProtectedRoute requiredRole="doctor"><AboutUsPage /></ProtectedRoute>} />
                        <Route path="/patients" element={<ProtectedRoute requiredRole="doctor"><PatientPage /></ProtectedRoute>} />
                        <Route path="/kalender" element={<ProtectedRoute requiredRole="doctor"><CalenderPage /></ProtectedRoute>} />
                        <Route path="/patient/search" element={<ProtectedRoute requiredRole="doctor"><PatientSearch /></ProtectedRoute>} />
                        <Route path="/patient/:id" element={<ProtectedRoute requiredRole="doctor"><PatientOverview /></ProtectedRoute>} />
                        <Route path="/artsen" element={<ProtectedRoute requiredRole="doctor"><ArtsPage /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute requiredRole="doctor"><DashboardPage /></ProtectedRoute>} />
                        <Route path="/notes" element={<ProtectedRoute requiredRole="doctor"><Notes /></ProtectedRoute>} />
                        <Route path="/artsession" element={<ProtectedRoute requiredRole="doctor"><ArtsSession /></ProtectedRoute>} />
                        <Route path="/physiosession" element={<ProtectedRoute requiredRole="doctor"><PhysioSessionPage /></ProtectedRoute>} />
                        <Route path="/activeartssession" element={<ProtectedRoute requiredRole="doctor"><ActiveArtsSession /></ProtectedRoute>} />
                        <Route path="/measurementspage" element={<ProtectedRoute requiredRole="doctor"><MeasurementsPage /></ProtectedRoute>} />
                        <Route path="/onderzoek-dashboard" element={<ProtectedRoute requiredRole="researcher"><OnderzoeksDashboard /></ProtectedRoute>} />
                        <Route path="/onderzoek/cmas-analyse" element={<ProtectedRoute requiredRole="researcher"><CMASAnalyse /></ProtectedRoute>} />
                        <Route path="/onderzoek/labresultaten" element={<ProtectedRoute requiredRole="researcher"><Labresultaten /></ProtectedRoute>} />
                        <Route path="/onderzoek/biomerker-trends" element={<Navigate to="/onderzoek/labresultaten" replace />} />
                        <Route path="/onderzoek/data-export" element={<ProtectedRoute requiredRole="researcher"><div className="p-5"><h1 className="text-2xl font-bold mb-4">Data Export - Binnenkort beschikbaar</h1><p>Deze pagina wordt momenteel ontwikkeld voor data export functionaliteit.</p></div></ProtectedRoute>} />
                        <Route path="/onderzoek/statistieken" element={<ProtectedRoute requiredRole="researcher"><div className="p-5"><h1 className="text-2xl font-bold mb-4">Statistieken - Binnenkort beschikbaar</h1><p>Deze pagina wordt momenteel ontwikkeld voor statistische analyse.</p></div></ProtectedRoute>} />
                        <Route path="/test-strapi" element={<ProtectedRoute requiredRole="doctor"><TestStrapiPage /></ProtectedRoute>} />
                        <Route path="/test-strapi2" element={<ProtectedRoute requiredRole="researcher"><TestStrapiPage /></ProtectedRoute>} />
                        <Route path="*" element={<NotFoundPage setHideNavbar={setHideNavbar} />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

export default App;
