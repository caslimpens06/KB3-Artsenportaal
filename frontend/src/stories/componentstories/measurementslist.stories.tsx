import type { Meta, StoryObj } from '@storybook/react';
import MeasurementList from '../../components/measurementslist';

const meta = {
    title: 'Components/MeasurementList',
    component: MeasurementList,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof MeasurementList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data voor de metingen
const mockMeasurements = [
    {
        id: 1,
        name: 'Kalium',
        value: '4 mmol/L',
        range: '3,5 - 5 mmol/L',
    },
    {
        id: 2,
        name: 'Calcium',
        value: '2,3 mmol/L',
        range: '2,1 - 2,55',
    },
    {
        id: 3,
        name: 'CK',
        value: '99 U/L',
        range: '<200 U/L',
    },
];

const mockRadiologyMeasurements = [
    {
        id: 1,
        name: 'Röntgenfoto Borst',
        value: 'Beschikbaar',
        range: '2024-03-15',
    },
    {
        id: 2,
        name: 'MRI Hersenen',
        value: 'Beschikbaar',
        range: '2024-03-14',
    },
];

export const DefaultMeasurements: Story = {
    args: {
        measurements: mockMeasurements,
        onChartClick: (id) => {
            console.log(`Chart clicked for measurement ${id}`);
        },
    },
};

export const RadiologyMeasurements: Story = {
    args: {
        measurements: mockRadiologyMeasurements,
        onChartClick: (id) => {
            console.log(`Radiology image clicked for measurement ${id}`);
        },
        currentTab: 'Radiologie',
    },
};

export const EmptyMeasurements: Story = {
    args: {
        measurements: [],
        onChartClick: (id) => {
            console.log(`Chart clicked for measurement ${id}`);
        },
    },
};
