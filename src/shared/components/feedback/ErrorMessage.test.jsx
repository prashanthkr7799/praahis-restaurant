/**
 * ErrorMessage Component Tests
 * Tests for the error display component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage Component', () => {
  it('should render with string error', () => {
    render(<ErrorMessage error="Network failed" />);
    expect(screen.getByText('Network failed')).toBeInTheDocument();
  });

  it('should render with error object', () => {
    render(<ErrorMessage error={{ message: 'Network error' }} />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should render default message for invalid error', () => {
    render(<ErrorMessage error={{}} />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('should render title', () => {
    render(<ErrorMessage error="Test" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage error="Error" onRetry={onRetry} />);
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should not render retry button when onRetry not provided', () => {
    render(<ErrorMessage error="Error" />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should call onRetry when button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage error="Error" onRetry={onRetry} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render error icon', () => {
    const { container } = render(<ErrorMessage error="Error" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
