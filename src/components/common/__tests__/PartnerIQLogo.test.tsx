import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import PartnerIQLogo from '../PartnerIQLogo';

describe('PartnerIQLogo', () => {
  it('renders full variant by default', () => {
    const { container } = render(<PartnerIQLogo variant="full" size="md" color="primary" />);
    const logo = container.querySelector('svg');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('width', '160');
    expect(logo).toHaveAttribute('height', '42');
  });

  it('renders icon variant correctly', () => {
    const { container } = render(<PartnerIQLogo variant="icon" size="sm" color="primary" />);
    const logo = container.querySelector('svg');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('width', '32');
    expect(logo).toHaveAttribute('height', '32');
  });

  it('renders text variant correctly', () => {
    const { container } = render(<PartnerIQLogo variant="text" size="lg" color="dark" />);
    const logo = container.querySelector('svg');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('width', '200');
    expect(logo).toHaveAttribute('height', '53');
  });

  it('applies custom className', () => {
    const { container } = render(<PartnerIQLogo variant="full" size="md" color="primary" className="custom-class" />);
    const logo = container.querySelector('svg');
    expect(logo).toHaveClass('custom-class');
  });

  it('uses correct dimensions for different sizes', () => {
    const { rerender, container } = render(<PartnerIQLogo variant="full" size="sm" color="primary" />);
    let logo = container.querySelector('svg');
    expect(logo).toHaveAttribute('width', '120');
    expect(logo).toHaveAttribute('height', '32');

    rerender(<PartnerIQLogo variant="full" size="xl" color="primary" />);
    logo = container.querySelector('svg');
    expect(logo).toHaveAttribute('width', '240');
    expect(logo).toHaveAttribute('height', '64');
  });

  it('contains Partner IQ text in full and text variants', () => {
    const { container: fullContainer } = render(<PartnerIQLogo variant="full" size="md" color="primary" />);
    const fullText = fullContainer.querySelector('text');
    expect(fullText).toHaveTextContent('Partner IQ');

    const { container: textContainer } = render(<PartnerIQLogo variant="text" size="md" color="primary" />);
    const textText = textContainer.querySelector('text');
    expect(textText).toHaveTextContent('Partner IQ');
  });

  it('contains IQ text in icon variant', () => {
    const { container } = render(<PartnerIQLogo variant="icon" size="md" color="primary" />);
    const text = container.querySelector('text');
    expect(text).toHaveTextContent('IQ');
  });
});