import { Meta, StoryFn } from '@storybook/react';
import PatientDetails from '../../components/patientdetails';
import { Patient } from '../../abstracts/ImportsModels';

export default {
  title: 'Components/PatientDetails',
  component: PatientDetails,
  tags: ['autodocs'],
}as Meta;

// Dummy data for the patient
const samplePatient: Patient = {
  Id: 1,
  Firstname: 'Jan',
  Lastname: 'Jansen',
  Email: 'jan.jansen@example.com',
  Age: 30,
  Phonenumber: '0612345678',
  EmailContact: 'contact@example.com',
  PhonenumberContact: '0698765432',
  Sex: 'Man',
  ImagePath: '',
  Specialists: [],
  Notes: [],
  Medications: [],
  Appointments: [],
  Visits: [],
};

const Template: StoryFn = (args) => <PatientDetails patient={samplePatient} {...args} />;

export const PatientInformation = Template.bind({});
PatientInformation.args = {
  patient: samplePatient,
};

