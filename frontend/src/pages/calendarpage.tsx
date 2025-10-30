import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentService, type Appointment } from "../services/appointmentService";

const getWeekNumber = (date: Date): number => {
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.valueOf() - firstJan.valueOf()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstJan.getDay() + 1) / 7);
};

const getDateOfISOWeek = (week: number, year: number): Date => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const day = simple.getDay();
    const diff = simple.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(simple.setDate(diff));
};


const getStartOfWeek = (date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
};

const CalenderPage: React.FC = () => {
    const [currentWeek, setCurrentWeek] = useState<Date>(getStartOfWeek(new Date()));
    const [selectedWeek, setSelectedWeek] = useState<number>(getWeekNumber(new Date()));
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const navigate = useNavigate();

    const days = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
    const times = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

    const handlePrevWeek = () => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeek(newDate);
        setSelectedWeek(getWeekNumber(newDate));
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeek(newDate);
        setSelectedWeek(getWeekNumber(newDate));
    };

    const handleWeekChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const week = parseInt(event.target.value, 10);
        const newDate = getDateOfISOWeek(week, new Date().getFullYear());
        setCurrentWeek(newDate);
        setSelectedWeek(week);
    };

    const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, "0");
        const monthNames = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
        const month = monthNames[date.getMonth()];
        return `${day} ${month}`;
    };

    const getDates = (startOfWeek: Date): Date[] => {
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const dates = getDates(new Date(currentWeek));

    useEffect(() => {
        const loadAppointments = () => {
            const allAppointments = appointmentService.getAllAppointments();
            setAppointments(allAppointments);
        };

        loadAppointments();
        const interval = setInterval(loadAppointments, 60000);
        return () => clearInterval(interval);
    }, []);

    const getAppointmentsForSlot = (date: Date, timeSlot: string): Appointment[] => {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const slotStart = new Date(date);
        slotStart.setHours(hours, minutes, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hours + 1, 0, 0, 0);

        return appointments.filter(appointment => {
            const appointmentStart = new Date(appointment.start);
            const appointmentDate = new Date(appointmentStart);
            appointmentDate.setHours(0, 0, 0, 0);
            const currentDate = new Date(date);
            currentDate.setHours(0, 0, 0, 0);
            return appointmentDate.getTime() === currentDate.getTime() &&
                appointmentStart < slotEnd &&
                new Date(appointment.end) > slotStart;
        });
    };

    const formatAppointmentTime = (date: Date): string => {
        return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    };

    const handleAppointmentClick = (appointment: Appointment) => {
        navigate(`/patient/search`, {
            state: {
                patientName: appointment.patientName,
                appointmentContext: appointment.id,
                fromCalendar: true,
                showCMASScores: true
            }
        });
    };

    const getWeekAppointmentCount = (): number => {
        const weekStart = new Date(currentWeek);
        const weekEnd = new Date(currentWeek);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.start);
            return appointmentDate >= weekStart && appointmentDate <= weekEnd;
        }).length;
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200 flex-shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-900">Alle Afspraken</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-600">Deze week</div>
                        <div className="text-xl font-bold text-blue-800">{getWeekAppointmentCount()}</div>
                        <div className="text-xs text-gray-500">
                            {getWeekAppointmentCount() === 1 ? 'afspraak' : 'afspraken'}
                        </div>
                    </div>
                </div>

                {getWeekAppointmentCount() === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                        <div className="flex items-center">
                            <div className="text-blue-400 mr-2">📅</div>
                            <div className="text-sm text-blue-700">
                                Geen afspraken deze week. Afspraken kunnen gemaakt worden via het Patiëntenoverzicht.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden p-6">
                <div className="bg-white h-full rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex-shrink-0">
                        <div className="flex justify-between items-center mb-4">
                            <button
                                className="text-blue-600 text-xl focus:outline-none w-10 hover:text-blue-800 transition-colors flex items-center justify-center h-10 rounded-lg hover:bg-blue-50"
                                onClick={handlePrevWeek}
                            >
                                &lt;
                            </button>
                            <h2 className="text-blue-800 font-medium text-lg">
                                {formatDate(currentWeek)} - {formatDate(new Date(currentWeek.getTime() + 6 * 86400000))}, {currentWeek.getFullYear()}
                            </h2>
                            <button
                                className="text-blue-600 text-xl focus:outline-none w-10 hover:text-blue-800 transition-colors flex items-center justify-center h-10 rounded-lg hover:bg-blue-50"
                                onClick={handleNextWeek}
                            >
                                &gt;
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <select
                                className="bg-white text-blue-600 border-2 border-blue-300 rounded-lg cursor-pointer text-center w-40 h-8 text-sm hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedWeek}
                                onChange={handleWeekChange}
                            >
                                {Array.from({ length: 52 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        Week {i + 1}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full border-collapse text-sm h-full">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr>
                                    <th className="border border-gray-300 p-2 text-center text-blue-800 bg-blue-50 w-20">Tijd</th>
                                    {days.map((day, index) => (
                                        <th key={index} className="border border-gray-300 p-2 text-center text-blue-800 bg-blue-50">
                                            <div className="font-semibold">{day}</div>
                                            <div className="text-xs font-normal text-gray-600">{formatDate(dates[index])}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {times.map((time, timeIndex) => (
                                    <tr key={timeIndex} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 p-1.5 text-center text-blue-800 font-medium bg-blue-50 text-xs">
                                            {time}
                                        </td>
                                        {dates.map((date, dateIndex) => {
                                            const slotAppointments = getAppointmentsForSlot(date, time);
                                            return (
                                                <td key={dateIndex} className="border border-gray-300 p-1 text-center align-top min-h-[50px] relative">
                                                    {slotAppointments.length === 0 ? (
                                                        <div className="h-10 opacity-0 hover:opacity-20 hover:bg-blue-100 rounded transition-all cursor-pointer text-gray-400">+</div>
                                                    ) : (
                                                        slotAppointments.map((appointment, appointmentIndex) => (
                                                            <div
                                                                key={`${appointment.id}-${appointmentIndex}`}
                                                                className="bg-blue-100 border-l-4 border-blue-500 p-1.5 mb-1 rounded text-left shadow-sm hover:bg-blue-200 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
                                                                title={`${appointment.patientName}\n${appointment.description}\n${formatAppointmentTime(appointment.start)} - ${formatAppointmentTime(appointment.end)}`}
                                                                onClick={() => handleAppointmentClick(appointment)}
                                                            >
                                                                <div className="text-xs font-semibold text-blue-800 truncate">{appointment.patientName}</div>
                                                                <div className="text-xs text-gray-600 truncate">{appointment.category}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    {formatAppointmentTime(appointment.start)} - {formatAppointmentTime(appointment.end)}
                                                                </div>
                                                                {appointment.description && (
                                                                    <div className="text-xs text-gray-600 truncate mt-0.5" title={appointment.description}>
                                                                        {appointment.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CalenderPage;
