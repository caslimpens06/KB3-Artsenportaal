import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import PatientFunctionalDetails from '../../components/patientfunctionaldetails';

export default {
  title: 'Components/PatientFunctionalDetails',
  component: PatientFunctionalDetails,
  tags: ['autodocs'],
}as Meta;

const Template: StoryFn = (args) => <PatientFunctionalDetails {...args} />;

export const Default = Template.bind({});
Default.args = {};
