import React, { useState } from 'react';
import { Meta, StoryFn } from '@storybook/react';
import  BloodTabBar  from '../../components/bloodtabbar';

export default {
  title: 'Components/bloodTabBar',
  component: BloodTabBar,
  tags: ['autodocs'],
  argTypes: {
    onTabClick: { action: 'tab clicked' }, 
  },
} as Meta;

const Template: StoryFn<any> = (args) => {
  const [selectedTab, setSelectedTab] = useState(args.selectedTab);

  return (
    <BloodTabBar 
      {...args} 
      selectedTab={selectedTab} 
      onTabClick={(tab: string) => setSelectedTab(tab)} 
    />
  );
};


export const BloedSelected = Template.bind({});
BloedSelected.args = {
  tabs: ['Bloed', 'Haematologie'],
  selectedTab: 'Bloed',
};

export const RontgenSelected = Template.bind({});
RontgenSelected.args = {
  tabs: ['Bloed', 'Haematologie'],
  selectedTab: 'Haematologie', 
};


