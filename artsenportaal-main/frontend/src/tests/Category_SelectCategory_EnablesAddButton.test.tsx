import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddDatePickerEventModal from "../../components/measurementscalendarfiles/AddDatePickerEventModal";
import { DatePickerEventFormData } from "../../components/measurementscalendarfiles/EventCalendar";

const Wrapper = () => {
  const [formData, setFormData] = useState<DatePickerEventFormData>({
    description: "Test",
    start: new Date(),
    end: new Date(),
    allDay: false,
  });

  const categories = [{ _id: "1", title: "Meeting" }];

  return (
    <AddDatePickerEventModal
      open={true}
      handleClose={jest.fn()}
      datePickerEventFormData={formData}
      setDatePickerEventFormData={setFormData}
      onAddEvent={jest.fn()}
      todos={categories}
    />
  );
};

describe("Category_SelectCategory_EnablesAddButton", () => {
  test("NoCategorySelected_DisablesAddButton", () => {
    render(<Wrapper />);
    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeDisabled();
  });

  test("CategorySelected_EnablesAddButton", async () => {
    render(<Wrapper />);
    const input = screen.getByLabelText(/categorie/i);
    await userEvent.type(input, "Meeting");
    await userEvent.keyboard("{Enter}");

    const button = screen.getByRole("button", { name: /toevoegen/i });
    expect(button).toBeEnabled();
  });
});
