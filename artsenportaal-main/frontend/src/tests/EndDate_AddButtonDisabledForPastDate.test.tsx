import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import AddDatePickerEventModal from "../../components/measurementscalendarfiles/AddDatePickerEventModal";
import { DatePickerEventFormData } from "../../components/measurementscalendarfiles/EventCalendar";

const Wrapper = ({ initialEnd }: { initialEnd?: Date }) => {
  const [formData, setFormData] = useState<DatePickerEventFormData>({
    description: "",
    start: new Date(),
    end: initialEnd || new Date(),
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

describe("EndDate_AddButtonDisabledForPastDate", () => {
  test("PastEndDate_DisablesAddButton", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    render(<Wrapper initialEnd={yesterday} />);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeDisabled();
  });

  test("TodayOrFutureEndDate_EnablesAddButton", () => {
    const today = new Date();
    render(<Wrapper initialEnd={today} />);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeEnabled();
  });
});
