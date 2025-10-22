import { useState, MouseEvent, useEffect } from "react"
import { Box, Button, ButtonGroup, Card, CardContent, CardHeader, Container, Divider } from "@mui/material"

import { Calendar, type Event, dateFnsLocalizer } from "react-big-calendar"

import format from "date-fns/format"
import parse from "date-fns/parse"
import startOfWeek from "date-fns/startOfWeek"
import getDay from "date-fns/getDay"
import enUS from "date-fns/locale/en-US"

import "react-big-calendar/lib/css/react-big-calendar.css"

import EventInfo from "./measurementscalendarfiles/EventInfo"
import AddEventModal from "./measurementscalendarfiles/AddEventModal"
import EventInfoModal from "./measurementscalendarfiles/EventInfoModal"
import { AddCategoryModal } from "./measurementscalendarfiles/AddCategoryModal"
import AddDatePickerEventModal from "./measurementscalendarfiles/AddDatePickerEventModal"
import { Patient } from "../abstracts/ImportsModels";
import { appointmentService } from "../services/appointmentService";

export interface ICategory {
  _id: string;
  title: string;
  color?: string;
}

interface IAppointment extends Event {
  _id: string;
  description: string;
  categoryId?: string;
}

interface MeasurementsCalendarProps {
  patient: Patient;
  onViewMeasurements: () => void;
}

const locales = {
    "en-US": enUS,
  }
  
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
  })

  export interface EventFormData {
    description: string
    categoryId?: string
  }
  
  export interface DatePickerEventFormData {
    description: string
    categoryId?: string
    allDay: boolean
    start?: Date
    end?: Date
  }
  
  export const generateId = () => (Math.floor(Math.random() * 10000) + 1).toString()


  const initialEventFormState: EventFormData = {
    description: "",
    categoryId: undefined,
  }
  
  const initialDatePickerEventFormData: DatePickerEventFormData = {
    description: "",
    categoryId: undefined,
    allDay: false,
    start: undefined,
    end: undefined,
  }

const predefinedCategories: ICategory[] = [
  {
    _id: "1",
    title: "Bloedonderzoek",
    color: "#FF0000"
  },
  {
    _id: "2",
    title: "Radiologie bezoek",
    color: "#00FF00"
  },
  {
    _id: "3",
    title: "CMAS-meting",
    color: "#0000FF"
  },
  {
    _id: "4",
    title: "Laboratorium meting",
    color: "#FF2996"
  },
  {
    _id: "5",
    title: "Consult",
    color: "#FFA500"
  },
  {
    _id: "6",
    title: "Overig",
    color: "#800080"
  },
];

const MeasurementsCalendar: React.FC<MeasurementsCalendarProps> = ({ patient, onViewMeasurements }) => {
  const [openSlot, setOpenSlot] = useState(false)
  const [openDatepickerModal, setOpenDatepickerModal] = useState(false)
  const [openTodoModal, setOpenTodoModal] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Event | IAppointment | null>(null)

  const [eventInfoModal, setEventInfoModal] = useState(false)

  const [events, setEvents] = useState<IAppointment[]>([]);
  const [categories, setCategories] = useState<ICategory[]>(predefinedCategories);

  const [eventFormData, setEventFormData] = useState<EventFormData>(initialEventFormState)

  const [datePickerEventFormData, setDatePickerEventFormData] =
    useState<DatePickerEventFormData>(initialDatePickerEventFormData)

  // Load appointments from localStorage when component mounts or patient changes
  useEffect(() => {
    const loadAppointments = () => {
      const calendarEvents = appointmentService.getAppointmentsForCalendar(patient.Id);
      setEvents(calendarEvents);
    };

    loadAppointments();
  }, [patient.Id]);

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setOpenSlot(true);
    setCurrentEvent({
      title: "",
      start: slotInfo.start,
      end: slotInfo.end,
      description: "",
      _id: "",
    });
  };

  const handleSelectEvent = (event: IAppointment) => {
    setCurrentEvent(event)
    setEventInfoModal(true)
  }

  const handleClose = () => {
    setEventFormData(initialEventFormState)
    setCurrentEvent(null)
    setOpenSlot(false)
  }

  const handleDatePickerClose = () => {
    setDatePickerEventFormData(initialDatePickerEventFormData)
    setOpenDatepickerModal(false)
  }

  const onAddEvent = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  
    if (!currentEvent) {
      return;
    }

    // Find the category title
    const selectedCategory = categories.find(cat => cat._id === eventFormData.categoryId);
    const categoryTitle = selectedCategory?.title || 'Algemeen';
  
    // Create appointment using service
    const appointmentData = {
      description: eventFormData.description,
      start: currentEvent.start as Date,
      end: currentEvent.end as Date,
      categoryId: eventFormData.categoryId
    };

    appointmentService.createAppointment(
      patient.Id, 
      `${patient.Firstname} ${patient.Lastname}`, 
      appointmentData,
      categoryTitle
    );

    // Reload events
    const calendarEvents = appointmentService.getAppointmentsForCalendar(patient.Id);
    setEvents(calendarEvents);
    
    handleClose();
  };

  const onAddEventFromDatePicker = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!datePickerEventFormData.start) {
      return;
    }

    const addHours = (date: Date | undefined, hours: number) => {
      return date ? new Date(date.getTime() + hours * 60 * 60 * 1000) : undefined
    }

    const setMinToZero = (date: Date) => {
      const newDate = new Date(date);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      return newDate;
    }

    // Calculate end time
    const endTime = datePickerEventFormData.allDay
      ? addHours(datePickerEventFormData.start, 12)
      : (datePickerEventFormData.end || addHours(datePickerEventFormData.start, 1));

    // Find the category title
    const selectedCategory = categories.find(cat => cat._id === datePickerEventFormData.categoryId);
    const categoryTitle = selectedCategory?.title || 'Algemeen';

    // Create appointment using service
    const appointmentData = {
      description: datePickerEventFormData.description,
      start: setMinToZero(datePickerEventFormData.start),
      end: setMinToZero(endTime as Date),
      categoryId: datePickerEventFormData.categoryId,
      allDay: datePickerEventFormData.allDay
    };

    appointmentService.createAppointment(
      patient.Id, 
      `${patient.Firstname} ${patient.Lastname}`, 
      appointmentData,
      categoryTitle
    );

    // Reload events
    const calendarEvents = appointmentService.getAppointmentsForCalendar(patient.Id);
    setEvents(calendarEvents);

    setDatePickerEventFormData(initialDatePickerEventFormData)
    setOpenDatepickerModal(false)
  }

  const onDeleteEvent = () => {
    if (currentEvent && '_id' in currentEvent) {
      appointmentService.deleteAppointment(currentEvent._id);
      
      // Reload events
      const calendarEvents = appointmentService.getAppointmentsForCalendar(patient.Id);
      setEvents(calendarEvents);
    }
    setEventInfoModal(false)
  }

  return (
    <Box
      mt={2}
      mb={2}
      component="main"
      sx={{
        flexGrow: 1,
        py: 8,
      }}
    >
      <Container maxWidth={false}>
        <Card>
          <CardHeader 
            title="Afsprakenkalender" 
            subheader="Bekijk en beheer uw medische afspraken" 
          />
          <Divider />
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <ButtonGroup size="large" variant="contained" aria-label="outlined primary button group">
                <Button onClick={() => setOpenDatepickerModal(true)} size="small" variant="contained">
                  Nieuwe afspraak
                </Button>
                <Button onClick={() => setOpenTodoModal(true)} size="small" variant="contained">
                  Bekijk categorieën
                </Button>
              </ButtonGroup>
            </Box>
            <Divider style={{ margin: 10 }} />
            <AddEventModal
              open={openSlot}
              handleClose={handleClose}
              eventFormData={eventFormData}
              setEventFormData={setEventFormData}
              onAddEvent={onAddEvent}
              todos={categories}
            />
            <AddDatePickerEventModal
              open={openDatepickerModal}
              handleClose={handleDatePickerClose}
              datePickerEventFormData={datePickerEventFormData}
              setDatePickerEventFormData={setDatePickerEventFormData}
              onAddEvent={onAddEventFromDatePicker}
              todos={categories}
            />
            <EventInfoModal
              open={eventInfoModal}
              handleClose={() => setEventInfoModal(false)}
              onDeleteEvent={onDeleteEvent}
              currentEvent={currentEvent as IAppointment}
              onViewDetails={onViewMeasurements}
            />
            <AddCategoryModal
              open={openTodoModal}
              handleClose={() => setOpenTodoModal(false)}
              categories={categories}
              setCategories={setCategories}
            />
            <Calendar
              localizer={localizer}
              events={events}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              startAccessor="start"
              components={{ event: EventInfo }}
              endAccessor="end"
              defaultView="week"
              eventPropGetter={(event) => {
                const hasCategory = categories.find((category) => category._id === event.categoryId)
                return {
                  style: {
                    backgroundColor: hasCategory ? hasCategory.color : "#b64fc8",
                    borderColor: hasCategory ? hasCategory.color : "#b64fc8",
                  },
                }
              }}
              style={{
                height: 900,
              }}
            />
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default MeasurementsCalendar;