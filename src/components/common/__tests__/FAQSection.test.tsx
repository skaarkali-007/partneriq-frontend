import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FAQSection from '../FAQSection';

// Wrapper component to provide router context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('FAQSection', () => {
  beforeEach(() => {
    render(
      <TestWrapper>
        <FAQSection />
      </TestWrapper>
    );
  });

  it('renders the FAQ section with title and description', () => {
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText(/Get answers to common questions about our partner program/)).toBeInTheDocument();
  });

  it('renders all FAQ items', () => {
    // Check for key FAQ questions
    expect(screen.getByText('How does the commission structure work?')).toBeInTheDocument();
    expect(screen.getByText('How quickly can I start earning commissions?')).toBeInTheDocument();
    expect(screen.getByText('What kind of support and training do you provide?')).toBeInTheDocument();
    expect(screen.getByText('When and how do I get paid?')).toBeInTheDocument();
    expect(screen.getByText('What marketing materials and tools are provided?')).toBeInTheDocument();
    expect(screen.getByText('What are the requirements to become a partner?')).toBeInTheDocument();
    expect(screen.getByText('How accurate is the tracking and attribution?')).toBeInTheDocument();
    expect(screen.getByText('What types of financial products can I promote?')).toBeInTheDocument();
  });

  it('expands and collapses FAQ items when clicked', () => {
    const firstQuestion = screen.getByText('How does the commission structure work?');
    const firstQuestionButton = firstQuestion.closest('button');
    
    // Initially, the answer should not be visible
    expect(screen.queryByText(/Our commission structure is designed to reward/)).not.toBeVisible();
    
    // Click to expand
    fireEvent.click(firstQuestionButton!);
    
    // Answer should now be visible
    expect(screen.getByText(/Our commission structure is designed to reward/)).toBeVisible();
    
    // Click to collapse
    fireEvent.click(firstQuestionButton!);
    
    // Answer should be hidden again (though still in DOM due to CSS transition)
    const answerElement = screen.getByText(/Our commission structure is designed to reward/).closest('div');
    expect(answerElement).toHaveClass('max-h-0', 'opacity-0');
  });

  it('displays CTAs within FAQ answers', () => {
    // Expand the first FAQ item
    const firstQuestion = screen.getByText('How does the commission structure work?');
    fireEvent.click(firstQuestion.closest('button')!);
    
    // Check for CTA button
    expect(screen.getByText('View Commission Details')).toBeInTheDocument();
    expect(screen.getByText('View Commission Details').closest('a')).toHaveAttribute('href', '/register');
  });

  it('renders different CTA types (primary and secondary)', () => {
    // Expand commission structure FAQ (has primary CTA)
    const commissionQuestion = screen.getByText('How does the commission structure work?');
    fireEvent.click(commissionQuestion.closest('button')!);
    
    const primaryCTA = screen.getByText('View Commission Details');
    expect(primaryCTA.closest('a')).toHaveClass('bg-blue-600', 'text-white');
    
    // Expand support FAQ (has secondary CTA)
    const supportQuestion = screen.getByText('What kind of support and training do you provide?');
    fireEvent.click(supportQuestion.closest('button')!);
    
    const secondaryCTA = screen.getByText('Learn About Support');
    expect(secondaryCTA.closest('a')).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('includes partner-focused content addressing commission structure', () => {
    const commissionQuestion = screen.getByText('How does the commission structure work?');
    fireEvent.click(commissionQuestion.closest('button')!);
    
    expect(screen.getByText(/Commission rates range from 15% to 45%/)).toBeInTheDocument();
    expect(screen.getByText(/bonuses for top performers/)).toBeInTheDocument();
  });

  it('includes partner-focused content addressing support', () => {
    const supportQuestion = screen.getByText('What kind of support and training do you provide?');
    fireEvent.click(supportQuestion.closest('button')!);
    
    expect(screen.getByText(/dedicated account managers/)).toBeInTheDocument();
    expect(screen.getByText(/24\/7 technical support/)).toBeInTheDocument();
    expect(screen.getByText(/maximize your earnings/)).toBeInTheDocument();
  });

  it('renders the additional CTA section at the bottom', () => {
    expect(screen.getByText('Still have questions?')).toBeInTheDocument();
    expect(screen.getByText('Become a Partner')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    
    // Check links
    expect(screen.getByText('Become a Partner').closest('a')).toHaveAttribute('href', '/register');
    expect(screen.getByText('Contact Support').closest('a')).toHaveAttribute('href', 'mailto:partners@partneriq.com');
  });

  it('has proper accessibility attributes', () => {
    const firstQuestionButton = screen.getByText('How does the commission structure work?').closest('button');
    
    expect(firstQuestionButton).toHaveAttribute('aria-expanded', 'false');
    expect(firstQuestionButton).toHaveAttribute('aria-controls', 'faq-answer-commission-structure');
    
    // Expand and check again
    fireEvent.click(firstQuestionButton!);
    expect(firstQuestionButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('supports keyboard navigation', () => {
    const firstQuestionButton = screen.getByText('How does the commission structure work?').closest('button');
    
    // Focus the button
    firstQuestionButton!.focus();
    expect(firstQuestionButton).toHaveFocus();
    
    // Press Enter to expand
    fireEvent.keyDown(firstQuestionButton!, { key: 'Enter' });
    expect(firstQuestionButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <TestWrapper>
        <FAQSection className="custom-class" />
      </TestWrapper>
    );
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('custom-class');
  });
});