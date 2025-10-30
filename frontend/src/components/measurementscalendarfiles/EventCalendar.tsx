import { useState, MouseEvent } from "react"
import { Box, Button, ButtonGroup, Card, CardContent, CardHeader, Container, Divider } from "@mui/material"

import { Calendar, type Event, dateFnsLocalizer } from "react-big-calendar"

import format from "date-fns/format"
import parse from "date-fns/parse"
import startOfWeek from "date-fns/startOfWeek"
import getDay from "date-fns/getDay"

import "react-big-calendar/lib/css/react-big-calendar.css"

import EventInfo from "./EventInfo"
import EventInfoModal from "./EventInfoModal"

import nl from "date-fns/locale/nl"

const locales = {
    "nl-NL": nl,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales,
})

export interface ITodo {
  _id: string
  title: string
  color?: string
}

export interface IEventInfo extends Event {
  _id: string
  description: string
    categoryId?: string
    categoryTitle?: string
}

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

const EventCalendar = () => {
  const [openSlot, setOpenSlot] = useState(false)
  const [openDatepickerModal, setOpenDatepickerModal] = useState(false)
  const [openTodoModal, setOpenTodoModal] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Event | IEventInfo | null>(null)

  const [eventInfoModal, setEventInfoModal] = useState(false)

  const [events, setEvents] = useState<IEventInfo[]>([])
  const [todos, setTodos] = useState<ITodo[]>([])

  const [eventFormData, setEventFormData] = useState<EventFormData>(initialEventFormState)

  const [datePickerEventFormData, setDatePickerEventFormData] =
    useState<DatePickerEventFormData>(initialDatePickerEventFormData)

  const handleSelectSlot = (event: Event) => {
    setOpenSlot(true)
    setCurrentEvent(event)
  }

  const handleSelectEvent = (event: IEventInfo) => {
    setCurrentEvent(event)
    setEventInfoModal(true)
  }

  const onDeleteEvent = () => {
    setEvents(() => [...events].filter((e) => e._id !== (currentEvent as IEventInfo)._id!))
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
          <CardHeader title="Calendar" subheader="Create Events and Todos and manage them easily" />
          <Divider />
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <ButtonGroup size="large" variant="contained" aria-label="outlined primary button group">
                <Button onClick={() => setOpenDatepickerModal(true)} size="small" variant="contained">
                  Add event
                </Button>
                <Button onClick={() => setOpenTodoModal(true)} size="small" variant="contained">
                  Create todo
                </Button>
              </ButtonGroup>
            </Box>
            <Divider style={{ margin: 10 }} />
            <EventInfoModal
              open={eventInfoModal}
              handleClose={() => setEventInfoModal(false)}
              onDeleteEvent={onDeleteEvent}
              currentEvent={currentEvent as IEventInfo} onViewDetails={function (): void {
                throw new Error("Function not implemented.")
              } }            />
            <Calendar
                localizer={localizer}
                culture="nl-NL"
                events={events}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                startAccessor="start"
                endAccessor="end"
                defaultView="week"
                components={{ event: EventInfo }}
                    eventPropGetter={(event) => {
                        const category = todos.find(todo => todo._id === event.categoryId)
                        return {
                            style: {
                                backgroundColor: category?.color,
                                borderColor: category?.color,
                            },
                        }
                    }}

                style={{ height: 900 }}
            />

          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default EventCalendar