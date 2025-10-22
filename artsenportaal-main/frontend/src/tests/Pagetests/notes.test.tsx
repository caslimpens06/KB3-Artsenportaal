import { render, screen } from "@testing-library/react";
import Notes from "../../pages/notes";

// Mock localStorage
const localStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test the Notes component
describe("Notes Component Tests", () => {
	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();
		localStorageMock.getItem.mockReturnValue(null);
	});

	it("Renders without crashing", () => {
		render(<Notes />);
		const heading = screen.getByText("Notities");
		expect(heading).toBeInTheDocument();
	});

	it("Shows empty state when no notes exist", () => {
		render(<Notes />);
		const emptyMessage = screen.getByText("Nog geen notities toegevoegd");
		expect(emptyMessage).toBeInTheDocument();
	});

	it("Shows search input field", () => {
		render(<Notes />);
		const searchInput = screen.getByPlaceholderText("Zoek notitie...");
		expect(searchInput).toBeInTheDocument();
	});

	it("Shows sorting headers", () => {
		render(<Notes />);
		const notitieHeader = screen.getByText("Notitie");
		const specialistHeader = screen.getByText("Specialist");
		const patientHeader = screen.getByText("Patiënt");
		const datumHeader = screen.getByText("Datum");
		
		expect(notitieHeader).toBeInTheDocument();
		expect(specialistHeader).toBeInTheDocument();
		expect(patientHeader).toBeInTheDocument();
		expect(datumHeader).toBeInTheDocument();
	});

	it("Displays notes when they exist", () => {
		// Mock localStorage to return sample notes
		const mockNotes = JSON.stringify([
			{
				id: "1",
				patientId: "123",
				patientName: "Jan Janssen",
				title: "Test notitie",
				content: "Dit is een test notitie",
				createdAt: new Date().toISOString(),
				specialistName: "Dr. Johannes Doe"
			}
		]);
		
		localStorageMock.getItem.mockReturnValue(mockNotes);
		
		render(<Notes />);
		
		// Check if the note is displayed
		const noteTitle = screen.getByText("Test notitie");
		const patientName = screen.getByText("Jan Janssen");
		const specialistName = screen.getByText("Dr. Johannes Doe");
		
		expect(noteTitle).toBeInTheDocument();
		expect(patientName).toBeInTheDocument();
		expect(specialistName).toBeInTheDocument();
	});
});