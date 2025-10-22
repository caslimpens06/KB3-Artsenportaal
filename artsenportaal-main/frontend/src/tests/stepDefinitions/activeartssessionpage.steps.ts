import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@jest/globals';
import { screen, fireEvent } from '@testing-library/react';

When('I click the radiology image button', async () => {
  const button = await screen.findByAltText('Radiology Button');
  fireEvent.click(button);
  expect(window.alert).toHaveBeenCalledWith('Radiology image clicked!');
});
