import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import MiniKalender from "../../components/minikalender";

export default {
  title: "Components/MiniKalender",
  component: MiniKalender,
  tags: ["autodocs"],
} as Meta<typeof MiniKalender>;

const Template: StoryFn<typeof MiniKalender> = (args) => <MiniKalender {...args} />;

export const Default = Template.bind({});
Default.args = {
  initialDate: new Date(), // Hier kun je een specifieke datum instellen indien gewenst
};
