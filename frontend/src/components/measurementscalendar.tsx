import React, { useState, useEffect, useRef, MouseEvent } from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { appointmentService, type Appointment } from "../services/appointmentService";
import { Patient } from "../abstracts/ImportsModels";
import AddDatePickerEventModal from "./measurementscalendarfiles/AddDatePickerEventModal";
import EventInfoModal from "./measurementscalendarfiles/EventInfoModal";

export interface ICategory {
    _id: string;
    title: string;
    color?: string;
}

export interface DatePickerEventFormData {
    description: string;
    categoryId?: string;
    allDay: boolean;
    start?: Date;
    end?: Date;
}

const predefinedCategories: ICategory[] = [
    { _id: "1", title: "Bloedonderzoek", color: "#CC0000" },
    { _id: "2", title: "Radiologie bezoek", color: "#008000" },
    { _id: "3", title: "CMAS-meting", color: "#1A1AFF" },
    { _id: "4", title: "Laboratorium meting", color: "#D60073" },
    { _id: "5", title: "Consult", color: "#FF8C00" },
    { _id: "6", title: "Overig", color: "#800080" },
];

const getWeekNumber = (date: Date): number => {
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date.valueOf() - firstJan.valueOf()) / 86400000;
    return Math.ceil((pastDays + firstJan.getDay() + 1) / 7);
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


interface MeasurementsCalendarProps {
    patient: Patient;
    onViewMeasurements: () => void;
}


const MeasurementsCalendar: React.FC<MeasurementsCalendarProps> = ({ patient, onViewMeasurements }) => {
    const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
    const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [openDatepickerModal, setOpenDatepickerModal] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Appointment | null>(null);
    const [eventInfoModal, setEventInfoModal] = useState(false);
    const [cellHeight, setCellHeight] = useState(50);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const calendarRef = useRef<HTMLTableElement>(null);
    const navigate = useNavigate();
    const categories = predefinedCategories;
    const days = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
    const times = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

    const [datePickerEventFormData, setDatePickerEventFormData] = useState<DatePickerEventFormData>({
        description: "",
        categoryId: undefined,
        allDay: false,
        start: undefined,
        end: undefined,
    });

    useEffect(() => {
        const observer = new ResizeObserver(() => {
            const firstCell = calendarRef.current?.querySelector("tbody tr td");
            if (firstCell) setCellHeight(firstCell.getBoundingClientRect().height);
        });
        if (calendarRef.current) observer.observe(calendarRef.current);
        return () => observer.disconnect();
    }, []);

    const loadAppointments = () => {
        const allAppointments = appointmentService.getAppointmentsForCalendar(patient.Id);
        setAppointments(allAppointments);
    };

    useEffect(() => {
        loadAppointments();
    }, [patient]);

    const getDates = (start: Date) => Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });

    const onDeleteEvent = () => {
        const eventId = (currentEvent as any)?.id ?? (currentEvent as any)?._id;
        if (!eventId) return;

        const deleted = appointmentService.deleteAppointment(eventId);
        if (deleted) {
            setAppointments((prev: Appointment[]) => prev.filter((apt: Appointment) => apt.id !== eventId));
            setToastMessage("Afspraak verwijderd");
            setTimeout(() => setToastMessage(null), 2000);
        } else {
            console.warn("Kon het event niet verwijderen:", eventId);
        }

        setEventInfoModal(false);
        setCurrentEvent(null);
        loadAppointments();
    };

    const dates = getDates(currentWeek);

    const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
        return `${day} ${months[date.getMonth()]}`;
    };

    const handlePrevWeek = () => {
        const d = new Date(currentWeek);
        d.setDate(d.getDate() - 7);
        setCurrentWeek(d);
        setSelectedWeek(getWeekNumber(d));
    };

    const handleNextWeek = () => {
        const d = new Date(currentWeek);
        d.setDate(d.getDate() + 7);
        setCurrentWeek(d);
        setSelectedWeek(getWeekNumber(d));
    };

    const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const week = parseInt(e.target.value);
        const d = getDateOfISOWeek(week, new Date().getFullYear());
        setCurrentWeek(d);
        setSelectedWeek(week);
    };

    const handleAppointmentClick = (appointment: Appointment) => {
        setCurrentEvent(appointment);
        setEventInfoModal(true);
    };

    const handleAddEventFromDatePicker = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!datePickerEventFormData.start) return;

        const start = new Date(datePickerEventFormData.start);
        start.setSeconds(0);
        start.setMilliseconds(0);

        const end = datePickerEventFormData.end
            ? new Date(datePickerEventFormData.end)
            : new Date(start.getTime() + 60 * 60 * 1000);

        const selectedCategory = categories.find(c => c._id === datePickerEventFormData.categoryId);
        const categoryTitle = selectedCategory?.title || "Algemeen";

        const appointmentData = {
            description: datePickerEventFormData.description,
            start,
            end,
            categoryId: datePickerEventFormData.categoryId,
            allDay: datePickerEventFormData.allDay
        };

        appointmentService.createAppointment(
            patient.Id,
            `${patient.Firstname} ${patient.Lastname}`,
            appointmentData,
            categoryTitle
        );

        const allAppointments = appointmentService.getAppointmentsForCalendar(patient.Id);
        setAppointments(allAppointments);
        setDatePickerEventFormData({ description: "", categoryId: undefined, allDay: false });
        setOpenDatepickerModal(false);
    };

    const getAppId = (app: Appointment): string =>
        (app as any)._id ? String((app as any)._id) :
            (app as any).id ? String((app as any).id) :
                Math.random().toString(36).substring(2, 9);

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-blue-900">
                    Afspraken met {patient.Firstname} {patient.Lastname}
                </h1>
                <Button onClick={() => setOpenDatepickerModal(true)} variant="contained" size="large">
                    Nieuwe afspraak
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white h-full rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Button onClick={handlePrevWeek}>&lt;</Button>
                            <span>{formatDate(currentWeek)} - {formatDate(new Date(currentWeek.getTime() + 6 * 86400000))}</span>
                            <Button onClick={handleNextWeek}>&gt;</Button>
                        </div>
                        <select value={selectedWeek} onChange={handleWeekChange} className="border p-1 rounded">
                            {Array.from({ length: 52 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table ref={calendarRef} className="w-full border-collapse text-sm h-full">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr>
                                    <th className="border p-2 w-20 bg-gray-50">Tijd</th>
                                    {days.map((day, i) => (
                                        <th key={i} className="border p-2 text-center bg-gray-50">
                                            {day}<br />{formatDate(dates[i])}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {times.map((time) => (
                                    <tr key={time}>
                                        <td className="border text-center bg-gray-50 min-w-[60px]">{time}</td>
                                        {dates.map((date, dayIndex) => {
                                            const [hours, minutes] = time.split(":").map(Number);
                                            const slotStart = new Date(date);
                                            slotStart.setHours(hours, minutes, 0, 0);
                                            const slotEnd = new Date(slotStart);
                                            slotEnd.setHours(hours + 1);

                                            const slotAppointments = appointments.filter(app => {
                                                const start = new Date(app.start);
                                                const end = new Date(app.end);
                                                return start < slotEnd && end > slotStart;
                                            });

                                            const renderedIds = new Set<string>();

                                            return (
                                                <td key={`${time}-${dayIndex}`} className="border p-0 relative min-h-[40px]">
                                                    {slotAppointments.map(app => {
                                                        const appId = getAppId(app);
                                                        if (renderedIds.has(appId)) return null;
                                                        renderedIds.add(appId);

                                                        const start = new Date(app.start);
                                                        const end = new Date(app.end);
                                                        const startHour = start.getHours() + start.getMinutes() / 60;
                                                        const endHour = end.getHours() + end.getMinutes() / 60;
                                                        const durationHours = endHour - startHour;

                                                        const topOffset = (startHour - hours) * cellHeight;
                                                        const height = durationHours * cellHeight;
                                                        const cat = categories.find(c => c._id === app.categoryId);

                                                        return (
                                                            <div
                                                                key={appId}
                                                                className="absolute left-0 right-0 flex items-center justify-center text-xs font-bold text-white rounded shadow-sm cursor-pointer transition-transform duration-150 hover:scale-105 hover:shadow-lg"
                                                                style={{
                                                                    top: topOffset,
                                                                    height: height,
                                                                    backgroundColor: cat?.color || "#8884FC",
                                                                }}
                                                                title="Klik voor meer informatie"
                                                                onClick={() => handleAppointmentClick(app)}
                                                            >
                                                                {cat?.title || "-"}
                                                            </div>
                                                        );
                                                    })}
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

            <AddDatePickerEventModal
                open={openDatepickerModal}
                handleClose={() => setOpenDatepickerModal(false)}
                datePickerEventFormData={datePickerEventFormData}
                setDatePickerEventFormData={setDatePickerEventFormData}
                onAddEvent={handleAddEventFromDatePicker}
                todos={categories}
            />

            <EventInfoModal
                open={eventInfoModal}
                handleClose={() => setEventInfoModal(false)}
                onDeleteEvent={onDeleteEvent}
                currentEvent={
                    currentEvent
                        ? {
                            _id: currentEvent.id,
                            start: new Date(currentEvent.start),
                            end: new Date(currentEvent.end),
                            description: currentEvent.description,
                            categoryId: currentEvent.categoryId,
                            categoryTitle: currentEvent.category,
                            allDay: false
                        }
                        : null
                }
                onViewDetails={onViewMeasurements}
            />

            {toastMessage && (
                <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-lg text-base animate-fadeInOut min-w-[250px] text-center">
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

export default MeasurementsCalendar;
