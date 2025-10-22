import PatientPage from "../../pages/patientpage";
import { fireEvent, render } from "@testing-library/react";
import { screen } from "@testing-library/dom";

describe("PatientPage Test", () => {
	it("Should render patientpage properly", () => {
		const page = render(<PatientPage />);
		expect(page.getByText("Patiëntenoverzicht")).toBeInTheDocument();

		const container = screen.getByRole('heading', { name: /Patiëntenoverzicht/i });
		expect(container).toBeInTheDocument();
	});
});