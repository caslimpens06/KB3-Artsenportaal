import { render, fireEvent } from '@testing-library/react';
import BloodTabBar from '../../components/bloodtabbar';

describe('BloodTabBar', () => {
  const tabs = ['Tab A', 'Tab B', 'Tab C'];
  const onTabClick = jest.fn();

  test('renders tabs correctly', () => {
    const { getByText } = render(
      <BloodTabBar tabs={tabs} selectedTab="Tab A" onTabClick={onTabClick} tabGroupName="test" />
    );

    tabs.forEach(tab => {
      expect(getByText(tab)).toBeInTheDocument();
    });
  });

  test('calls onTabClick when a tab is clicked', () => {
    const { getByText } = render(
      <BloodTabBar tabs={tabs} selectedTab="Tab A" onTabClick={onTabClick} tabGroupName="test" />
    );

    fireEvent.click(getByText('Tab B'));
    expect(onTabClick).toHaveBeenCalledWith('Tab B');
  });
});
