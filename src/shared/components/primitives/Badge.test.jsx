/**
 * Component Render Tests
 * Basic render tests for shared UI components
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Import components
import Badge from './Badge';

describe('Badge Component', () => {
  it('should render with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should render with default variant', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-primary');
  });

  it('should render with secondary variant', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-gray-100');
  });

  it('should render with destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-destructive');
  });

  it('should render with success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-success');
  });

  it('should render with info variant', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-info');
  });

  it('should render with warning variant', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-warning');
  });

  it('should render with outline variant', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('border');
  });

  it('should render with small size', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('text-xs');
  });

  it('should render with medium size (default)', () => {
    const { container } = render(<Badge size="md">Medium</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('text-sm');
  });

  it('should render with large size', () => {
    const { container } = render(<Badge size="lg">Large</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('text-base');
  });

  it('should apply custom className', () => {
    const { container } = render(<Badge className="custom-class">Custom</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('custom-class');
  });

  it('should render as inline-flex', () => {
    const { container } = render(<Badge>Inline</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('inline-flex');
  });
});
