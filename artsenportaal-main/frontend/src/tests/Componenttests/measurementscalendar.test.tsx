import { render, fireEvent, waitFor, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MeasurementsCalendar from '../../components/measurementscalendar';
import { Patient } from '../../abstracts/ImportsModels';
import '@testing-library/jest-dom';

jest.mock('react-big-calendar', () => ({
  __esModule: true,
  Calendar: function MockCalendar(props: any) {
    return <div data-testid="big-calendar">{props.children}</div>;
  },
  dateFnsLocalizer: () => ({}),
}));

jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn((date) => date.toString()),
  parse: jest.fn((dateStr) => new Date(dateStr)),
  startOfWeek: jest.fn((date) => new Date(date)),
  getDay: jest.fn((date) => date.getDay()),
}));

jest.mock('date-fns/locale/en-US', () => ({
  ...jest.requireActual('date-fns/locale/en-US'),
}));

describe('MeasurementsCalendar', () => {
  const mockPatient = new Patient(
    'John', 
    'Doe', 
    'john@example.com', 
    30, 
    '1234567890', 
    'emergency@example.com', 
    '0987654321', 
    'M', 
    '', 
    [] 
  );
  const onViewMeasurements = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <MemoryRouter>
        <MeasurementsCalendar patient={mockPatient} onViewMeasurements={onViewMeasurements} />
      </MemoryRouter>
    );

    expect(getByText('Afsprakenkalender')).toBeInTheDocument();
    expect(getByText('Bekijk en beheer uw medische afspraken')).toBeInTheDocument();
    expect(getByTestId('big-calendar')).toBeInTheDocument();
  });

  test('opens AddEventModal when "Nieuwe afspraak" button is clicked', async () => {
    const { getByText } = render(
      <MemoryRouter>
        <MeasurementsCalendar patient={mockPatient} onViewMeasurements={onViewMeasurements} />
      </MemoryRouter>
    );

    fireEvent.click(getByText('Nieuwe afspraak'));

    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      const modalText = within(modal).getByText((content) => content.includes('Toevoegen'));
      expect(modalText).toBeInTheDocument();
    });
  });
});
