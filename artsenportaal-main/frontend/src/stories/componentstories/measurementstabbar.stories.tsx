import React, { useState } from 'react';
import { Meta, StoryFn } from '@storybook/react';
import TabBar from '../../components/measurementstabbar';

export default {
  title: 'Components/measurementsTabBar',
  component: TabBar,
  tags: ['autodocs'],
  argTypes: {
    onTabClick: { action: 'tab clicked' }, // Logt de klikactie in Storybook
  },
} as Meta;

const Template: StoryFn<any> = (args) => {
  const [selectedTab, setSelectedTab] = useState(args.selectedTab);

  return (
    <TabBar 
      {...args} 
      selectedTab={selectedTab} 
      onTabClick={(tab: string) => setSelectedTab(tab)} 
    />
  );
};


export const BloedSelected = Template.bind({});
BloedSelected.args = {
  tabs: ['Bloed', 'Röntgen', 'CMAS', 'Lab'],
  selectedTab: 'Bloed', 
};

export const RontgenSelected = Template.bind({});
RontgenSelected.args = {
  tabs: ['Bloed', 'Röntgen', 'CMAS', 'Lab'],
  selectedTab: 'Röntgen',
};

export const CMASSelected = Template.bind({});
CMASSelected.args = {
  tabs: ['Bloed', 'Röntgen', 'CMAS', 'Lab'],
  selectedTab: 'CMAS', 
};

export const LabSelected = Template.bind({});
LabSelected.args = {
  tabs: ['Bloed', 'Röntgen', 'CMAS', 'Lab'],
  selectedTab: 'Lab', 
};
