export class Visit {
    Id!: number;
    Date!: Date;
    Patient!: string;
    Specialist!: string;
    Reason: string;
    Diagnosis: string;
    Medication: string;
    Notes!: string;
    constructor(id: number, date: Date, patient: string, specialist: string, session: string, reason: string, diagnosis: string, medication: string, notes: string) {
        this.Id = id;
        this.Date = date;
        this.Patient = patient;
        this.Specialist = specialist;
        this.Reason = reason;
        this.Diagnosis = diagnosis;
        this.Medication = medication;
        this.Notes = notes;
    }
}