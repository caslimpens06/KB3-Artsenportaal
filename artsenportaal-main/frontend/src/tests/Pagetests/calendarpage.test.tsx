import React from "react";
import { render, fireEvent, screen, cleanup, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CalenderPage from "../../pages/calendarpage";
import { appointmentService, type Appointment } from "../../services/appointmentService";

// Mock the appointment service
jest.mock("../../services/appointmentService");

// Helper to get current week's Monday
const getCurrentWeekMonday = (): Date => {
	const today = new Date();
	const day = today.getDay();
	const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
	return new Date(today.setDate(diff));
};

const mockAppointment: Appointment = {
	id: "test-1",
	patientId: 1,
	patientName: "Test Patient",
	title: "Test Appointment",
	description: "Test Description",
	start: (() => {
		const monday = getCurrentWeekMonday();
		monday.setHours(10, 0, 0, 0); // 10:00 AM on current week's Monday
		return monday;
	})(),
	end: (() => {
		const monday = getCurrentWeekMonday();
		monday.setHours(11, 0, 0, 0); // 11:00 AM on current week's Monday
		return monday;
	})(),
	category: "Bloedonderzoek",
	categoryId: "1",
	status: "scheduled",
	createdAt: new Date("2024-06-01T00:00:00")
};

describe("Calendar Page", () => {
	beforeEach(() => {
		// Mock the appointment service methods
		(appointmentService.getAllAppointments as jest.Mock).mockReturnValue([mockAppointment]);
	});

	afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	});

	test("renders calendar page", () => {
		render(
			<BrowserRouter>
				<CalenderPage />
			</BrowserRouter>
		);

		const heading = screen.getByText("Kalender");
		expect(heading).toBeInTheDocument();
	});

	test("displays appointment count", async () => {
		render(
			<BrowserRouter>
				<CalenderPage />
			</BrowserRouter>
		);

		await waitFor(() => {
			const appointmentCount = screen.getByText("1");
			expect(appointmentCount).toBeInTheDocument();
		});
	});

	test("displays appointments in time slots", async () => {
		render(
			<BrowserRouter>
				<CalenderPage />
			</BrowserRouter>
		);

		await waitFor(() => {
			const patientName = screen.getByText("Test Patient");
			expect(patientName).toBeInTheDocument();
		});
	});
});