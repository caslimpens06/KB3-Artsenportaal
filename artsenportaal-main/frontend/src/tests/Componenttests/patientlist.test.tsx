// import { render, screen, fireEvent, Matcher } from "@testing-library/react";
// import PatientList from "../../components/patientlist";
// import type { PatientListProps } from "../../components/patientlist";

// describe("PatientList component", () => {
//   it("should render all patients correctly", () => {
//     const mockPatients: PatientListProps["patients"] = [
//       {
//         Id: 1,
//         Firstname: "John",
//         Lastname: "Doe",
//         Email: "john.doe@example.com",
//         Sex: "Male",
//         Appointments: [1, 2, 3],
//       },
//       {
//         Id: 2,
//         Firstname: "Jane",
//         Lastname: "Smith",
//         Email: "jane.smith@example.com",
//         Sex: "Female",
//         Appointments: [4],
//       },
//     ];

//     const mockOnPatientClick = jest.fn();

//     render(<PatientList patients={mockPatients} onPatientClick={mockOnPatientClick} />);

//     mockPatients.forEach((patient: { firstname: any; lastname: any; email: Matcher; sex: Matcher; appointments: string | any[]; }) => {
//       expect(screen.getByText(`${patient.firstname} ${patient.lastname}`)).toBeInTheDocument();
//       expect(screen.getByText(patient.email)).toBeInTheDocument();
//       expect(screen.getByText(patient.sex)).toBeInTheDocument();
//       expect(screen.getByText(patient.appointments.length.toString())).toBeInTheDocument();
//     });
//   });

//   it("should call onPatientClick when a patient is clicked", () => {
//     const mockPatients: PatientListProps["patients"] = [
//       {
//         id: 1,
//         firstname: "John",
//         lastname: "Doe",
//         email: "john.doe@example.com",
//         sex: "Male",
//         appointments: [1, 2, 3],
//       },
//     ];

//     const mockOnPatientClick = jest.fn();

//     render(<PatientList patients={mockPatients} onPatientClick={mockOnPatientClick} />);

//     const patientRow = screen.getByText("John Doe").closest(".patient-row-wrapper");
//     fireEvent.click(patientRow!);

//     expect(mockOnPatientClick).toHaveBeenCalledWith(1);
//   });
// });

export default {
  
}