import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import LogboekSettings from "../../components/logboeksettings";

export default {
  title: "Components/LogboekSettings",
  component: LogboekSettings,
  tags: ["autodocs"],
} as Meta<typeof LogboekSettings>;

const Template: StoryFn<typeof LogboekSettings> = (args) => <LogboekSettings {...args} />;

export const Default = Template.bind({});
Default.args = {} as const;
