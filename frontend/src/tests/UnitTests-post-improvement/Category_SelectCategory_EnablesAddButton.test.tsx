import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddDatePickerEventModal from "../../components/measurementscalendarfiles/AddDatePickerEventModal";
import { DatePickerEventFormData } from "../../components/measurementscalendarfiles/EventCalendar";
import { ICategory } from "../../components/measurementscalendar";

// categorieën voor de test
const categories: ICategory[] = [{ _id: "1", title: "Bloedonderzoek" }];

// wrapper vult alles in behalve de categorie
const Wrapper = () => {
  const [formData, setFormData] = useState<DatePickerEventFormData>({
    description: "Test afspraak",
    start: new Date("2025-10-30T09:10:00.000Z"),
    end: new Date("2025-10-30T11:30:00.000Z"),
    allDay: false,
    categoryId: undefined,
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

describe("AddDatePickerEventModal - Categorie vereist", () => {
  test("Knop is disabled als categorie niet is ingevuld", () => {
    render(<Wrapper />);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeDisabled();
  });

  test("Knop wordt enabled na selectie van categorie", async () => {
    render(<Wrapper />);

    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeDisabled();

    const input = screen.getByLabelText(/categorie/i);

    // selecteer de categorie via autocomplete
    await userEvent.type(input, "Bloedonderzoek");
    await userEvent.keyboard("{ArrowDown}{Enter}");

    // knop moet nu enabled zijn
    expect(button).toBeEnabled();
  });
});
