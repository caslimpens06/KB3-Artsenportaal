import React from "react";
import Sidebar from "../../components/sidebar";
import { JSX } from "react/jsx-runtime";
import { Meta } from "@storybook/react/*";

export default {
  title: "Components/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
}as Meta;

const Template = (args: JSX.IntrinsicAttributes) => <Sidebar {...args} />;

export const Default = {
  render: Template,
  args: {},
};
