import { Meta, StoryFn } from '@storybook/react';
import PatientVisits from '../../components/patientvisits';
import { Patient, Visit } from '../../abstracts/ImportsModels';

export default {
  title: 'Components/PatientVisits',
  component: PatientVisits,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'This component displays a list of patient visits in a scrollable view.',
      },
    },
  },
} as Meta;

const Template: StoryFn<typeof PatientVisits> = (args) => <PatientVisits {...args} />;

export const Default = Template.bind({});

// Example patient and visit data for Storybook
const visits: Visit[] = [
  new Visit(1, new Date('2024-11-25'), 'John Doe', 'Dr. Smith', 'Routine Checkup', 'Headache', 'Migraine', 'Aspirin', 'Patient is recovering well.'),
  new Visit(2, new Date('2024-11-20'), 'Jane Doe', 'Dr. Adams', 'Follow-Up', 'Fatigue', 'Anemia', 'Iron Supplements', 'Patient requires follow-up tests.'),
  new Visit(3, new Date('2024-11-15'), 'Alice Smith', 'Dr. Brown', 'Consultation', 'Pain', 'Arthritis', 'Ibuprofen', 'Patient has improved mobility.'),
];

const examplePatient = new Patient(
  'John',
  'Doe',
  'john.doe@example.com',
  30,
  '123-456-7890',
  'contact.john.doe@example.com',
  '987-654-3210',
  'Male',
  'path/to/image.jpg',
  visits
);

Default.args = {
  patient: examplePatient,
};
