import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddDatePickerEventModal from "../../components/measurementscalendarfiles/AddDatePickerEventModal";
import { DatePickerEventFormData } from "../../components/measurementscalendarfiles/EventCalendar";

const Wrapper = () => {
  const [formData, setFormData] = useState<DatePickerEventFormData>({
    description: "", // gebruik description voor content
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
      todos={[]} // geen categorieën nodig voor deze test
    />
  );
};

describe("NoteContent_RequiredField_EnablesAddButton", () => {
  test("EmptyContent_DisablesAddButton", () => {
    render(<Wrapper />);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeDisabled();
  });

  test("ContentWithOneCharacter_EnablesAddButton", async () => {
    render(<Wrapper />);
    const input = screen.getByLabelText(/beschrijving/i); // description veld is content
    const button = screen.getByRole("button", { name: /toevoegen/i });
    await userEvent.type(input, "A");
    expect(button).toBeEnabled();
  });
});
