import { render, fireEvent } from '@testing-library/react';
import GraphPopup from '../../components/graphpopup';

describe('GraphPopup', () => {
  const onClose = jest.fn();

  test('renders correctly when open', () => {
    const { getByText } = render(
      <GraphPopup isOpen={true} onClose={onClose} />
    );

    expect(getByText('Kalium')).toBeInTheDocument();
    expect(getByText('Natrium')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    const { queryByText } = render(
      <GraphPopup isOpen={false} onClose={onClose} />
    );

    expect(queryByText('Kalium')).not.toBeInTheDocument();
  });

  test('calls onClose when background is clicked', () => {
    const { getByText } = render(
      <GraphPopup isOpen={true} onClose={onClose} />
    );

    fireEvent.click(getByText('Kalium').closest('div')!.parentElement!);
    expect(onClose).toHaveBeenCalled();
  });
});
