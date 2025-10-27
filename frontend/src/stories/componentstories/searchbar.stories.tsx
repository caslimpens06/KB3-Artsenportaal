// src/components/SearchBar.stories.tsx
import React from "react";
import SearchBar from "../../components/searchbar";
import { Meta, StoryFn } from "@storybook/react/*";

export default {
  title: "Components/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
}as Meta;

const Template: StoryFn = (args) => <SearchBar onSearch={function (query: string): void {
    throw new Error("Function not implemented.");
} } {...args} />;

export const Default = Template.bind({});
Default.args = {
  onSearch: (query: any) => console.log("Search query:", query),
};
