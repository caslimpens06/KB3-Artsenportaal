import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import AddDatePickerEventModal from "../../components/measurementscalendarfiles/AddDatePickerEventModal";
import { DatePickerEventFormData } from "../../components/measurementscalendarfiles/EventCalendar";

// Wrapper component for testing
const Wrapper = ({ start, end }: { start?: Date; end?: Date }) => {
  const [formData, setFormData] = useState<DatePickerEventFormData>({
    description: "Test event", // description must be filled for button to enable
    start: start || new Date(),
    end: end || new Date(),
    allDay: false,
  });

  return (
    <AddDatePickerEventModal
      open={true}
      handleClose={jest.fn()}
      datePickerEventFormData={formData}
      setDatePickerEventFormData={setFormData}
      onAddEvent={jest.fn()}
      todos={[]}
    />
  );
};

describe("StartBeforeEnd_PreventsStartAfterEnd", () => {
  test("StartAfterEnd_DisablesAddButton", () => {
    const start = new Date();
    const end = new Date();
    start.setMinutes(end.getMinutes() + 1); // start ligt na end
    render(<Wrapper start={start} end={end} />);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeDisabled();
  });

  test("StartEqualsEnd_DisablesAddButton", () => {
    const start = new Date();
    const end = new Date(start.getTime()); // start = end
    render(<Wrapper start={start} end={end} />);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    // Button is disabled because start === end is invalid
    expect(button).toBeDisabled();
  });

  test("StartBeforeEnd_EnablesAddButton", () => {
    const start = new Date("2025-10-01T13:30:00");
    const end = new Date("2025-10-01T14:00:00"); // start ligt vóór end
    render(<Wrapper start={start} end={end} />);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeEnabled();
  });
});
