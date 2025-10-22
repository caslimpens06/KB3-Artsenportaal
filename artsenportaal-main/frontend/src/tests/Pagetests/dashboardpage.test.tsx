import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DashboardPage, { AppointmentListItem } from "../../pages/dashboardpage";
import { appointmentService, type Appointment } from "../../services/appointmentService";

// Mock the appointment service
jest.mock("../../services/appointmentService");

const mockAppointment: Appointment = {
	id: "test-1",
	patientId: 1,
	patientName: "Test Patient",
	title: "Test Appointment",
	description: "Test Description",
	start: new Date("2024-06-15T10:00:00"),
	end: new Date("2024-06-15T11:00:00"),
	category: "Bloedonderzoek",
	categoryId: "1",
	status: "scheduled",
	createdAt: new Date("2024-06-01T00:00:00")
};

describe("Dashboard Page", () => {
	beforeEach(() => {
		// Mock the appointment service methods
		(appointmentService.getAllUpcomingAppointments as jest.Mock).mockReturnValue([mockAppointment]);
	});

	test("should render", () => {
		render(
			<BrowserRouter>
				<DashboardPage />
			</BrowserRouter>
		);

		// Use a more specific selector for the calendar
		const heading = screen.getByText(/Hallo, Dr. Johannes Doe/);
		expect(heading).toBeInTheDocument();
	});
});

describe("AppointmentListItem Component", () => {
	test("should render", () => {
		const mockOnClick = jest.fn();
		
		render(
			<AppointmentListItem appointment={mockAppointment} onClick={mockOnClick} />
		);

		const patientName = screen.getByText(mockAppointment.patientName);
		expect(patientName).toBeInTheDocument();
		
		const description = screen.getByText(mockAppointment.description);
		expect(description).toBeInTheDocument();

		const category = screen.getByText(mockAppointment.category);
		expect(category).toBeInTheDocument();
	});
});