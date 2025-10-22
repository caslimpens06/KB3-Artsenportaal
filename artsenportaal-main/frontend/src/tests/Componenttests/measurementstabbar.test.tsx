import { render, fireEvent } from '@testing-library/react';
import MeasurementTabBar from '../../components/measurementstabbar';

describe('MeasurementTabBar', () => {
  const tabs = ['Tab 1', 'Tab 2', 'Tab 3'];
  const onTabClick = jest.fn();

  test('renders tabs correctly', () => {
    const { getByText } = render(
      <MeasurementTabBar tabs={tabs} selectedTab="Tab 1" onTabClick={onTabClick} tabGroupName="test" />
    );

    tabs.forEach(tab => {
      expect(getByText(tab)).toBeInTheDocument();
    });
  });

  test('calls onTabClick when a tab is clicked', () => {
    const { getByText } = render(
      <MeasurementTabBar tabs={tabs} selectedTab="Tab 1" onTabClick={onTabClick} tabGroupName="test" />
    );

    fireEvent.click(getByText('Tab 2'));
    expect(onTabClick).toHaveBeenCalledWith('Tab 2');
  });
});
