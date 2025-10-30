import React from "react";
import Sidebar from "../../components/sidebar";
import { JSX } from "react/jsx-runtime";
import { Meta } from "@storybook/react/*";
import { SidebarProps } from "../../components/sidebar";

export default {
  title: "Components/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
}as Meta;

const Template = (args: SidebarProps) => <Sidebar {...args} />;

export const Default = {
  render: Template,
  args: {},
};
