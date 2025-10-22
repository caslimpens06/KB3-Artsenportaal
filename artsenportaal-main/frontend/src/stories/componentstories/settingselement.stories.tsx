// SettingsElement.stories.tsx
import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import SettingsElement from '../../components/settingselement';

const meta: Meta = {
  title: 'Components/SettingsElement',
  component: SettingsElement,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} as Meta;

export default meta;

const Template: StoryFn<{ status: boolean; title: string }> = (args) => <SettingsElement {...args} />;

export const Notification = Template.bind({});
Notification.args = {
  status: false,
  title: 'Meldingen ontvangen?',
};

export const DarkMode = Template.bind({});
DarkMode.args = {
  status: true,
  title: 'Enable Dark Mode',
};

export const LocationAccess = Template.bind({});
LocationAccess.args = {
  status: false,
  title: 'Enable Location Access',
};
