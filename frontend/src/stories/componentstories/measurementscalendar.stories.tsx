import type { Meta, StoryObj } from '@storybook/react';
import MeasurementsCalendar from '../../components/measurementscalendar';
import { Patient } from '../../abstracts/ImportsModels';
import { BrowserRouter } from 'react-router-dom';

const meta = {
  title: 'Components/MeasurementsCalendar',
  component: MeasurementsCalendar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof MeasurementsCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock patient data
const mockPatient: Patient = new Patient(
  'John', // firstname
  'Doe', // lastname
  'john.doe@example.com', // email  
  33, // age (calculated from 1990-01-01)
  '0612345678', // phonenumber
  'emergency@example.com', // email_contact
  '0612345678', // phonenumber_contact
  'M', // sex
  '', // imagePath (optional)
  [] // visits (optional)
);

export const Default: Story = {
  args: {
    patient: mockPatient,
    onViewMeasurements: () => console.log('View measurements clicked'),
  },
};

export const EmptyCalendar: Story = {
  args: {
    patient: mockPatient,
    onViewMeasurements: () => console.log('View measurements clicked'),
  },
  // Override the initial events to be empty
  parameters: {
    initialEvents: [],
  },
};

export const WithCustomEvents: Story = {
  args: {
    patient: mockPatient,
    onViewMeasurements: () => console.log('View measurements clicked'),
  },
  parameters: {
    initialEvents: [
      {
        _id: 'custom-1',
        title: 'CMAS-meting',
        description: 'Routine CMAS measurement',
        start: new Date(2024, 3, 15, 10, 0),
        end: new Date(2024, 3, 15, 11, 0),
        categoryId: '3',
      },
      {
        _id: 'custom-2',
        title: 'Radiologie bezoek',
        description: 'X-ray appointment',
        start: new Date(2024, 3, 16, 14, 0),
        end: new Date(2024, 3, 16, 15, 0),
        categoryId: '2',
      },
    ],
  },
};
