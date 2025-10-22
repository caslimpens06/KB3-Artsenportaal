import { render, screen, fireEvent } from '@testing-library/react';
import RadiologyPopup from '../../components/radiologypopup';

describe('RadiologyPopup', () => {
    const mockOnClose = jest.fn();
    const testImageUrl = 'test-image.jpg';

    it('should not render when isOpen is false', () => {
        render(
            <RadiologyPopup 
                isOpen={false} 
                onClose={mockOnClose} 
                imageUrl={testImageUrl} 
            />
        );
        
        const popup = screen.queryByRole('img');
        expect(popup).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
        render(
            <RadiologyPopup 
                isOpen={true} 
                onClose={mockOnClose} 
                imageUrl={testImageUrl} 
            />
        );
        
        const image = screen.getByAltText('Radiology');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', testImageUrl);
    });

    it('should call onClose when clicking outside the popup', () => {
        render(
            <RadiologyPopup 
                isOpen={true} 
                onClose={mockOnClose} 
                imageUrl={testImageUrl} 
            />
        );
        
        const overlay = screen.getByTestId('popup-overlay');
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when clicking inside the popup', () => {
        render(
            <RadiologyPopup 
                isOpen={true} 
                onClose={mockOnClose} 
                imageUrl={testImageUrl} 
            />
        );
        
        const popupContent = screen.getByTestId('popup-content');
        fireEvent.click(popupContent);
        expect(mockOnClose).not.toHaveBeenCalled();
    });
});
