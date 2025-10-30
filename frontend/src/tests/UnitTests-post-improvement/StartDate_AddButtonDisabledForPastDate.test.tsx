import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import AddDatePickerEventModal from "../../components/measurementscalendarfiles/AddDatePickerEventModal";
import { DatePickerEventFormData } from "../../components/measurementscalendarfiles/EventCalendar";
import { ICategory } from "../../components/measurementscalendar";

const categories: ICategory[] = [{ _id: "1", title: "Bloedonderzoek" }];

const Wrapper = () => {
  const [formData, setFormData] = useState<DatePickerEventFormData>({
    description: "Test afspraak",
    start: undefined,
    end: new Date("2025-10-30T11:30:00.000Z"),
    allDay: false,
    categoryId: categories[0]._id,
  });

  return (
    <AddDatePickerEventModal
      open={true}
      handleClose={() => {}}
      datePickerEventFormData={formData}
      setDatePickerEventFormData={setFormData}
      onAddEvent={() => {}}
      todos={categories}
    />
  );
};

describe("AddDatePickerEventModal - Startdatum vereist", () => {
  test("Toevoegen-knop is disabled als startdatum niet is ingevuld", () => {
    render(<Wrapper />);
    
    const button = screen.getByRole("button", { name: /toevoegen/i });
    
    expect(button).toBeDisabled();
  });
});
