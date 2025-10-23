import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddDatePickerEventModal from "../../components/measurementscalendarfiles/AddDatePickerEventModal";
import { DatePickerEventFormData } from "../../components/measurementscalendarfiles/EventCalendar";

const Wrapper = () => {
  const [formData, setFormData] = useState<DatePickerEventFormData>({
    description: "",
    start: new Date(),
    end: new Date(),
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

describe("NoteTitle_RequiredField_EnablesAddButton", () => {
  test("EmptyTitle_DisablesAddButton", () => {
    render(<Wrapper />);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeDisabled();
  });

  test("TitleWithOneCharacter_EnablesAddButton", async () => {
    render(<Wrapper />);
    const input = screen.getByLabelText(/beschrijving/i);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    await userEvent.type(input, "A");
    expect(button).toBeEnabled();
  });
});
