import { render, screen, within } from '@testing-library/react';
import MeasurementsPage from '../../pages/measurementspage';
import userEvent from '@testing-library/user-event';

describe('MeasurementsPage', () => {
  test('renders MeasurementsPage and checks initial state', () => {
    render(<MeasurementsPage />);
    
    // Check main tabs
    const mainTabs = screen.getByRole('tablist', { name: /main tabs/i });
    expect(mainTabs).toBeInTheDocument();
    expect(within(mainTabs).getByRole('tab', { name: 'Bloed' })).toBeInTheDocument();
    expect(within(mainTabs).getByRole('tab', { name: 'Radiologie' })).toBeInTheDocument();
    expect(within(mainTabs).getByRole('tab', { name: 'CMAS' })).toBeInTheDocument();
    expect(within(mainTabs).getByRole('tab', { name: 'Lab' })).toBeInTheDocument();
    
    expect(screen.getByText('Kalium')).toBeInTheDocument();
  });

  test('changes tab when a different main tab is clicked', () => {
    render(<MeasurementsPage />);
    
    const mainTabs = screen.getByRole('tablist', { name: /main tabs/i });
    const labTab = within(mainTabs).getByRole('tab', { name: 'Lab' });
    userEvent.click(labTab);
    
    expect(screen.getByText('Galectin-9')).toBeInTheDocument();
    expect(screen.getByText('CXCL10')).toBeInTheDocument();
  });

  test('changes blood tab when a different blood tab is clicked', () => {
    render(<MeasurementsPage />);
    
    // First ensure we're on the blood main tab
    const mainTabs = screen.getByRole('tablist', { name: /main tabs/i });
    const bloodMainTab = within(mainTabs).getByRole('tab', { name: 'Bloed' });
    userEvent.click(bloodMainTab);
    
    // Then click the Haematologie sub-tab
    const bloodTabs = screen.getByRole('tablist', { name: /blood tabs/i });
    const haematologieTab = within(bloodTabs).getByRole('tab', { name: 'Haematologie' });
    userEvent.click(haematologieTab);
    
    expect(screen.getByText('Hemoglobine')).toBeInTheDocument();
    expect(screen.getByText('Hematocriet')).toBeInTheDocument();
  });
});
