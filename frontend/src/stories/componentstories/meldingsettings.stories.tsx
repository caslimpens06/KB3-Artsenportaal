import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import MeldingSettings from "../../components/meldingsettings";

export default {
  title: "Components/MeldingSettings",
  component: MeldingSettings,
  tags: ["autodocs"],
} as Meta<typeof MeldingSettings>;

const Template: StoryFn<typeof MeldingSettings> = (args) => <MeldingSettings {...args} />;

export const Default = Template.bind({});
Default.args = {} as const;
