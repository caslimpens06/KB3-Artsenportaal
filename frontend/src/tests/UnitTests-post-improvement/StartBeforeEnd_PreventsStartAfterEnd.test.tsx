import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import AddDatePickerEventModal from "../../components/measurementscalendarfiles/AddDatePickerEventModal";
import { DatePickerEventFormData } from "../../components/measurementscalendarfiles/EventCalendar";

const Wrapper = ({ start, end }: { start: Date; end: Date }) => {
  const [formData, setFormData] = useState<DatePickerEventFormData>({
    description: "Test afspraak",
    start,
    end,
    allDay: false,
    categoryId: "1", // vul een categorie in zodat description + categorie validatie passeert
  });

  return (
    <AddDatePickerEventModal
      open={true}
      handleClose={() => {}}
      datePickerEventFormData={formData}
      setDatePickerEventFormData={setFormData}
      onAddEvent={() => {}}
      todos={[{ _id: "1", title: "Bloedonderzoek" }]}
    />
  );
};

describe("AddDatePickerEventModal - Relatie begin- en einddatum", () => {
  test("Begin < Eind → knop enabled", () => {
    const start = new Date("2025-10-30T09:00:00");
    const end = new Date("2025-10-30T10:00:00");
    render(<Wrapper start={start} end={end} />);

    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeEnabled();
  });

  test("Begin = Eind → knop disabled", () => {
    const start = new Date("2025-10-30T09:00:00");
    const end = new Date("2025-10-30T09:00:00");
    render(<Wrapper start={start} end={end} />);

    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeDisabled();
  });

  test("Begin > Eind → knop disabled", () => {
    const start = new Date("2025-10-30T10:00:00");
    const end = new Date("2025-10-30T09:00:00");
    render(<Wrapper start={start} end={end} />);

    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeDisabled();
  });
});
