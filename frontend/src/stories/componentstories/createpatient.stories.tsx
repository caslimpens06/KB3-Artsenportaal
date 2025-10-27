import { Meta, StoryFn } from "@storybook/react";
import CreatePatient from "../../components/createpatient";

export default {
  title: "Components/CreatePatient",
  component: CreatePatient,
  argTypes: {},
  tags: ["autodocs"],
} as Meta;

const Template: StoryFn = (args) => <CreatePatient {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const FilledForm = Template.bind({});
FilledForm.args = {
  id: 1,
  firstname: "Jan",
  lastname: "Jansen",
  email: "jan.jansen@example.com",
  age: 30,
  phonenumber: "0612345678",
  sex: true,
  firstnameContact: "Marie",
  lastnameContact: "Jansen",
  emailContact: "marie.jansen@example.com",
  phonenumberContact: "0623456789",
  specialist: "Dr. Smith",
  note: "Reguliere controle",
  medication: "Ibuprofen",
  appointment: "12/12/2024",
};
