/**
 * LoadingSpinner Component Tests
 * Tests for the loading indicator component
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render with default text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<LoadingSpinner text="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('should render without text in compact mode', () => {
    render(<LoadingSpinner compact text="Hidden Text" />);
    expect(screen.queryByText('Hidden Text')).not.toBeInTheDocument();
  });

  it('should render spinner icon', () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('should render with small size', () => {
    const { container } = render(<LoadingSpinner size="small" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-4', 'w-4');
  });

  it('should render with default size', () => {
    const { container } = render(<LoadingSpinner size="default" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-8', 'w-8');
  });

  it('should render with large size', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-12', 'w-12');
  });

  it('should render in compact mode', () => {
    const { container } = render(<LoadingSpinner compact />);
    const wrapper = container.querySelector('div');
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    expect(wrapper).not.toHaveClass('flex-col');
  });

  it('should render in non-compact mode', () => {
    const { container } = render(<LoadingSpinner compact={false} />);
    const wrapper = container.querySelector('div');
    expect(wrapper).toHaveClass('flex-col');
  });
});
