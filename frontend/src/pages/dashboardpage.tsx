import * as React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentService, type Appointment } from "../services/appointmentService";

interface AppointmentListItemProps {
	appointment: Appointment;
	onClick: () => void;
}

export const AppointmentListItem: React.FC<AppointmentListItemProps> = ({ appointment, onClick }) => {
	const formatDate = (date: Date): string => {
		return date.toLocaleDateString('nl-NL', {
			weekday: 'short',
			day: '2-digit',
			month: '2-digit',
		});
	};

	const formatTime = (date: Date): string => {
		return date.toLocaleTimeString('nl-NL', {
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	return (
		<div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer shadow-sm" onClick={onClick}>
			<div className="flex justify-between items-start">
				<div className="flex-1">
					<div className="flex items-center gap-3 mb-2">
						<h3 className="font-semibold text-blue-900 text-lg hover:text-blue-700 transition-colors">
							{appointment.patientName}
						</h3>
						<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
							{appointment.category}
						</span>
					</div>
					<p className="text-gray-700 text-sm mb-2">{appointment.description}</p>
					<div className="flex items-center gap-4 text-sm text-gray-600">
						<span className="flex items-center gap-1">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
							</svg>
							{formatDate(appointment.start)}
						</span>
						<span className="flex items-center gap-1">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							{formatTime(appointment.start)} - {formatTime(appointment.end)}
						</span>
					</div>
				</div>
				<div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition-colors">
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>
		</div>
	);
};

const DashboardPage: React.FC = () => {
	const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		const loadAppointments = () => {
			const appointments = appointmentService.getAllUpcomingAppointments();
			setUpcomingAppointments(appointments.slice(0, 10));
		};

		loadAppointments();

		const interval = setInterval(loadAppointments, 60000);

		if (process.env.NODE_ENV === 'development') {
			(window as any).cleanFakeAppointments = () => {
				const deleted1 = appointmentService.deleteAppointmentsByPatientName('Maria Janssen');
				const deleted2 = appointmentService.deleteAppointmentsByPatientName('Jan Jansen');
				console.log(`Deleted ${deleted1 + deleted2} fake appointments`);
				loadAppointments();
			};
		}

		return () => clearInterval(interval);
	}, []);

	const handlePatientClick = (appointment: Appointment) => {
		navigate(`/patient/search`, {
			state: {
				patientName: appointment.patientName,
				appointmentContext: appointment.id,
				fromDashboard: true
			}
		});
	};

	return (
		<div className="flex flex-col w-full h-screen overflow-hidden">
			<div className="w-full px-5 pt-5 pb-4 flex-shrink-0">
				<div className="flex justify-center">
					<h1 className="text-3xl font-bold text-blue-900 border-b-4 border-blue-900 pb-2">
						Hallo, Dr. Johannes Doe
					</h1>
				</div>
			</div>

			<div className="flex justify-center items-start px-5 pb-8 flex-grow overflow-hidden">
				<div className="w-full max-w-4xl">
					<div className="bg-blue-50 rounded-3xl p-6 h-full">
						<div className="bg-white rounded-3xl p-8 h-full flex flex-col">
							<div className="flex justify-between items-start w-full flex-wrap mb-6 flex-shrink-0">
								<section>
									<h2 className="text-xl font-semibold text-blue-900 mb-2">Aankomende afspraken</h2>
									<hr className="border-2 border-blue-900 w-32" />
								</section>
								<div className="flex items-center gap-2 text-sm text-gray-600">
									<span>🕒 Automatisch ververst</span>
								</div>
							</div>

							{upcomingAppointments.length === 0 ? (
								<div className="flex flex-col items-center justify-center flex-grow text-gray-500">
									<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
										<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
										</svg>
									</div>
									<p className="text-lg font-medium mb-2">Geen aankomende afspraken</p>
									<p className="text-sm text-center max-w-md">
										Maak nieuwe afspraken via de patiëntenpagina.<br />
										Ga naar <strong>Patiëntenoverzicht → Selecteer patiënt → Afspraken → Nieuwe afspraak</strong>
									</p>
								</div>
							) : (
								<div className="space-y-3 flex-grow overflow-y-auto pr-2">
									{upcomingAppointments.map((appointment) => (
										<AppointmentListItem
											key={appointment.id}
											appointment={appointment}
											onClick={() => handlePatientClick(appointment)}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DashboardPage;
