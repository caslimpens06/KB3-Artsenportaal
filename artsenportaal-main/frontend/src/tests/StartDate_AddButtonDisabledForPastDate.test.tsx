import { render, screen } from "@testing-library/react"
import AddDatePickerEventModal from "../../components/measurementscalendarfiles/AddDatePickerEventModal"
import { DatePickerEventFormData } from "../../components/measurementscalendarfiles/EventCalendar"
import { ICategory } from "../../components/measurementscalendar"

const categories: ICategory[] = [{ _id: "1", title: "Meeting" }]

// Default form data zonder categoryId
const defaultFormData: DatePickerEventFormData = {
  description: "Test",
  start: undefined,
  end: undefined,
  allDay: false,
}

describe("TC02 – Begindatum afspraak", () => {
  test("Past date disables Add button", () => {
    render(
      <AddDatePickerEventModal
        open={true}
        handleClose={jest.fn()}
        datePickerEventFormData={{
          ...defaultFormData,
          start: new Date("2000-01-01"), // verleden
        }}
        setDatePickerEventFormData={jest.fn()}
        onAddEvent={jest.fn()}
        todos={categories}
      />
    )

    const addButton = screen.getByRole("button", { name: /toevoegen/i })
    expect(addButton).toBeDisabled()
  })

  test("Today or future date enables Add button", () => {
    render(
      <AddDatePickerEventModal
        open={true}
        handleClose={jest.fn()}
        datePickerEventFormData={{
          ...defaultFormData,
          start: new Date(Date.now() + 1000 * 60), // toekomst
        }}
        setDatePickerEventFormData={jest.fn()}
        onAddEvent={jest.fn()}
        todos={categories}
      />
    )

    const addButton = screen.getByRole("button", { name: /toevoegen/i })
    expect(addButton).toBeEnabled()
  })
})
