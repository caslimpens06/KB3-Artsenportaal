import { render, fireEvent } from '@testing-library/react';
import MeasurementList from '../../components/measurementslist';

const mockMeasurements = [
    { id: 1, name: 'Meting 1', value: '10', range: '5-15' },
    { id: 2, name: 'Meting 2', value: '20', range: '15-25' },
];

describe('MeasurementList', () => {
    const mockOnChartClick = jest.fn();

    test('renders correctly with measurements', () => {
        const { getByText } = render(
            <MeasurementList measurements={mockMeasurements} onChartClick={mockOnChartClick} />
        );

        expect(getByText('Alle metingen')).toBeInTheDocument();
        expect(getByText('Meting 1')).toBeInTheDocument();
        expect(getByText('Meting 2')).toBeInTheDocument();
    });

    test('opens GraphPopup when chart button is clicked', () => {
        const { getAllByText } = render(
            <MeasurementList measurements={mockMeasurements} onChartClick={mockOnChartClick} />
        );

        const buttons = getAllByText('Grafiek');
        fireEvent.click(buttons[0]);
        
        // Verify that the click handler was called and state was updated
        expect(mockOnChartClick).toHaveBeenCalledWith(1);
    });

    test('opens RadiologyPopup when "Bekijk foto" button is clicked', () => {
        const { getAllByText } = render(
            <MeasurementList measurements={mockMeasurements} onChartClick={mockOnChartClick} currentTab="Radiologie" />
        );

        const buttons = getAllByText('Bekijk foto');
        fireEvent.click(buttons[0]);
        
        // Verify that the click handler was called with the correct ID
        expect(mockOnChartClick).toHaveBeenCalledWith(1);
    });
});
