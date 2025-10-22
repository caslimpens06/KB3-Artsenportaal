import React, { useState } from 'react';
import GraphPopup, { GraphPopupProps } from '../../components/graphpopup';
import { StoryFn } from '@storybook/react';

export default {
  title: 'Components/GraphPopup',
  component: GraphPopup,
};

const Template: StoryFn<GraphPopupProps> = (args) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Graph Popup</button>
      <GraphPopup {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
};

