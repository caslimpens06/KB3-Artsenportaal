import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AddDatePickerEventModal from "../../components/measurementscalendarfiles/AddDatePickerEventModal";
import { DatePickerEventFormData } from "../../components/measurementscalendarfiles/EventCalendar";

const Wrapper = ({ initialDescription = "" }) => {
  const [formData, setFormData] = useState<DatePickerEventFormData>({
    description: initialDescription,
    start: new Date(),
    end: new Date(),
    allDay: false,
    categoryId: "1", // categorie ingevuld zodat alleen beschrijving getest wordt
  });

  return (
    <AddDatePickerEventModal
      open={true}
      handleClose={jest.fn()}
      datePickerEventFormData={formData}
      setDatePickerEventFormData={setFormData}
      onAddEvent={jest.fn()}
      todos={[{ _id: "1", title: "Test" }]}
    />
  );
};

describe("AddDatePickerEventModal - Beschrijvingsveld", () => {
  test("beschrijving leeg → knop Toevoegen is disabled", () => {
    render(<Wrapper initialDescription="" />);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeDisabled();
  });

  test("beschrijving 1 teken → knop Toevoegen is enabled", async () => {
    render(<Wrapper initialDescription="" />);
    const input = screen.getByLabelText(/beschrijving/i);
    const button = screen.getByRole("button", { name: /toevoegen/i });

    await userEvent.type(input, "A");
    expect(button).toBeEnabled();
  });

  test("beschrijving 50 tekens → knop Toevoegen is enabled", async () => {
    render(<Wrapper initialDescription="" />);
    const input = screen.getByLabelText(/beschrijving/i);
    const button = screen.getByRole("button", { name: /toevoegen/i });

    await userEvent.type(input, "A".repeat(50));
    expect(button).toBeEnabled();
  });

  test("beschrijving 51 tekens → knop Toevoegen is disabled", async () => {
    render(<Wrapper initialDescription="" />);
    const input = screen.getByLabelText(/beschrijving/i);
    const button = screen.getByRole("button", { name: /toevoegen/i });

    await userEvent.type(input, "A".repeat(51));
    expect(button).toBeDisabled();
  });
});
