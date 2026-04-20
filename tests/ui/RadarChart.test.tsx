import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RadarChart } from '../../src/ui/components/RadarChart';

const labels = ['Ownership', 'Value', 'Goal Alignment', 'Communication', 'Fun'];
const values = [4.0, 3.0, 5.0, 2.0, 4.5];

describe('RadarChart', () => {
  it('renders an SVG element', () => {
    render(<RadarChart labels={labels} values={values} maxValue={5} name="Test" />);
    const svg = screen.getByLabelText(/radar chart for test/i);
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe('svg');
  });

  it('renders the session name', () => {
    render(<RadarChart labels={labels} values={values} maxValue={5} name="Sprint 1" />);
    expect(screen.getByText('Sprint 1')).toBeInTheDocument();
  });

  it('renders the session date', () => {
    render(<RadarChart labels={labels} values={values} maxValue={5} name="Test" date="Apr 25" />);
    expect(screen.getByText('Apr 25')).toBeInTheDocument();
  });

  it('renders all question labels', () => {
    render(<RadarChart labels={labels} values={values} maxValue={5} name="Test" />);
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders score values for non-zero scores', () => {
    render(<RadarChart labels={labels} values={values} maxValue={5} name="Test" />);
    expect(screen.getByText('4.0')).toBeInTheDocument();
    expect(screen.getByText('3.0')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });

  it('does not render score for zero values', () => {
    const zeroValues = [0, 3, 0, 2, 0];
    render(<RadarChart labels={labels} values={zeroValues} maxValue={5} name="Test" />);
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<RadarChart labels={labels} values={values} maxValue={5} name="Test" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders with custom size', () => {
    render(<RadarChart labels={labels} values={values} maxValue={5} name="Test" size={400} />);
    const svg = screen.getByLabelText(/radar chart/i);
    expect(svg.getAttribute('width')).toBe('400');
  });

  it('handles different maxValue scales', () => {
    const doraValues = [2, 4, 3, 1, 5];
    render(<RadarChart labels={['A', 'B', 'C', 'D', 'E']} values={doraValues} maxValue={6} name="DORA" />);
    expect(screen.getByText('DORA')).toBeInTheDocument();
  });
});
