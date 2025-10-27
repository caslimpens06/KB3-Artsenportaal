import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import DashboardSettings from "../../components/dashboardsettings";

export default {
  title: "Components/DashboardSettings",
  component: DashboardSettings,
  tags: ["autodocs"],
} as Meta<typeof DashboardSettings>;

const Template: StoryFn<typeof DashboardSettings> = (args: any) => <DashboardSettings {...args} />;

export const Default = Template.bind({});
Default.args = {} as const;
