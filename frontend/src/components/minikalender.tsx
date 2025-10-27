import React, { useRef, useState } from "react";
import { Appointment } from "../services/appointmentService";

interface MiniKalenderProps {
	initialDate?: Date;
	appointments?: Appointment[];
}

const MiniKalender: React.FC<MiniKalenderProps> = ({ initialDate = new Date(), appointments = [] }) => {
	const calendarRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLDivElement>(null);

	const [currentDate, setCurrentDate] = useState(initialDate);
	const [hoveredDay, setHoveredDay] = useState<number | null>(null);

	const daysOfWeek = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
	const monthNames = [
		"januari", "februari", "maart", "april", "mei", "juni",
		"juli", "augustus", "september", "oktober", "november", "december",
	];

	const handlePreviousMonth = () => {
		setCurrentDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
	};

	const handleNextMonth = () => {
		setCurrentDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
	};

	// Helper function to check if a day has appointments
	const getDayAppointments = (day: number): Appointment[] => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		
		return appointments.filter(appointment => {
			const appointmentDate = new Date(appointment.start);
			return appointmentDate.getFullYear() === year &&
				   appointmentDate.getMonth() === month &&
				   appointmentDate.getDate() === day;
		});
	};

	const renderCalendar = () => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstDayOfMonth = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const prevMonthDays = new Date(year, month, 0).getDate();
		const nextMonthDays = 42 - (daysInMonth + firstDayOfMonth);

		const calendarDays = [];

		// Previous month days
		for (let i = firstDayOfMonth - 1; i >= 0; i--) {
			calendarDays.push(
				<div key={`prev-${i}`} className="text-gray-400 flex items-center justify-center h-8 text-sm opacity-50">
					{prevMonthDays - i}
				</div>
			);
		}

		// Current month days
		for (let day = 1; day <= daysInMonth; day++) {
			const dayAppointments = getDayAppointments(day);
			const hasAppointments = dayAppointments.length > 0;
			const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

			calendarDays.push(
				<div
					key={day}
					className={`relative flex items-center justify-center h-8 w-8 mx-auto cursor-pointer transition-all duration-200 ${
						isToday 
							? 'bg-white text-blue-700 font-bold rounded-full shadow-md'
							: 'hover:bg-blue-600 hover:text-white rounded-full'
					}`}
					onMouseEnter={() => setHoveredDay(day)}
					onMouseLeave={() => setHoveredDay(null)}
				>
					<span className="z-10 text-sm">{day}</span>
					
					{/* Appointment indicator */}
					{hasAppointments && (
						<div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border ${
							isToday 
								? 'bg-red-500 border-white' 
								: 'bg-yellow-400 border-blue-700'
						} z-20`}></div>
					)}

					{/* Hover tooltip */}
					{hoveredDay === day && dayAppointments.length > 0 && (
						<div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 px-3 py-2 rounded-lg shadow-xl border z-30 min-w-[220px] max-w-[280px]">
							<div className="text-xs font-semibold mb-2 text-blue-700">
								{day} {monthNames[month]} - {dayAppointments.length} afspraak{dayAppointments.length > 1 ? 'en' : ''}
							</div>
							{dayAppointments.slice(0, 3).map((apt) => {
								const time = apt.start.toLocaleTimeString('nl-NL', { 
									hour: '2-digit', 
									minute: '2-digit' 
								});
								return (
									<div key={apt.id} className="text-xs text-gray-600 mb-1 flex justify-between">
										<span className="font-medium">{apt.patientName}</span>
										<span className="text-gray-500">{time}</span>
									</div>
								);
							})}
							{dayAppointments.length > 3 && (
								<div className="text-xs text-gray-500 mt-1 pt-1 border-t">
									En nog {dayAppointments.length - 3} meer...
								</div>
							)}
							{/* Tooltip arrow */}
							<div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white"></div>
						</div>
					)}
				</div>
			);
		}

		// Next month days
		for (let i = 1; i <= nextMonthDays; i++) {
			calendarDays.push(
				<div key={`next-${i}`} className="text-gray-400 flex items-center justify-center h-8 text-sm opacity-50">
					{i}
				</div>
			);
		}

		return calendarDays;
	};

	return (
		<div ref={calendarRef} className="bg-blue-700 text-white p-6 rounded-xl shadow-lg w-full max-w-sm mx-auto lg:mx-0">
			<nav>
				<a href="/kalender" className="block text-center text-lg font-bold mb-4 hover:text-blue-200 transition-colors" ref={titleRef as unknown as React.RefObject<HTMLAnchorElement>}>
					📅 Kalender
				</a>
			</nav>
			<div className="flex items-center justify-between text-sm mb-4">
				<button 
					onClick={handlePreviousMonth} 
					className="cursor-pointer hover:bg-blue-600 rounded-full p-2 transition-colors flex items-center justify-center"
					aria-label="Vorige maand"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<div className="font-semibold text-base">
					{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
				</div>
				<button 
					onClick={handleNextMonth} 
					className="cursor-pointer hover:bg-blue-600 rounded-full p-2 transition-colors flex items-center justify-center"
					aria-label="Volgende maand"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>
			<div className="grid grid-cols-7 gap-1 text-center mb-3">
				{daysOfWeek.map((day) => (
					<div key={day} className="text-blue-200 text-xs font-medium py-1">{day}</div>
				))}
			</div>
			<div className="grid grid-cols-7 gap-1 text-center">
				{renderCalendar()}
			</div>
			
			{/* Legend */}
			<div className="mt-4 pt-3 border-t border-blue-600">
				<div className="flex items-center justify-center gap-4 text-xs">
					<div className="flex items-center gap-1.5">
						<div className="w-2.5 h-2.5 bg-yellow-400 rounded-full border border-blue-700"></div>
						<span>Afspraak</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
							<span className="text-blue-700 text-xs font-bold">•</span>
						</div>
						<span>Vandaag</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MiniKalender;
