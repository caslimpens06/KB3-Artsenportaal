// src/components/ProfileSetting.stories.tsx
import React from "react";
import ProfileSetting from "../../components/profilesettings";
import { Meta, StoryFn } from "@storybook/react/*";

export default {
  title: "Components/ProfileSetting",
  component: ProfileSetting,
  tags: ["autodocs"],
}as Meta;

const Template: StoryFn = (args) => <ProfileSetting user={{
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    jobtitle: "",
    specialist: "",
    location: ""
}} {...args} />;

export const ProfileTemplate = Template.bind({});
ProfileTemplate.args = {
  user: {
    firstName: "John",
    lastName: "Doe",
    phone: "123-456-7890",
    email: "john.doe@example.com",
    jobtitle: "Pediatric Specialist",
    specialist: "Pediatrician",
    location: "Amsterdam, Netherlands",
  },
};
