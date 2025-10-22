import React from "react";
import SettingSwitch from "../../components/switchsettings";
import { Meta, StoryFn } from "@storybook/react";

export default {
  title: "Components/SettingSwitch",
  component: SettingSwitch,
  tags: ["autodocs"],
}as Meta;

const Template: StoryFn<{ status: boolean }> = (args: { status: boolean }) => <SettingSwitch {...args} />;

export const Switch = Template.bind({});
Switch.args = {
  status: true,
};
