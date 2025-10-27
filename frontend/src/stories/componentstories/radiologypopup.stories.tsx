import React, { useState } from "react";
import RadiologyPopup from "../../components/radiologypopup";
import type { ComponentProps } from "react";
import { StoryFn } from "@storybook/react"

// Define the props type using ComponentProps utility type
type RadiologyPopupProps = ComponentProps<typeof RadiologyPopup>;

export default {
  title: "Components/RadiologyPopup",
  component: RadiologyPopup,
};

const Template: StoryFn<RadiologyPopupProps> = (args) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Popup</button>
      <RadiologyPopup {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  imageUrl: "https://example.com/image.jpg", // Vervang dit door een echte afbeelding
};

export const WithoutImage = Template.bind({});
WithoutImage.args = {
  imageUrl: undefined,
};
