import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import FieldConfirm from './FieldConfirm';

describe('FieldConfirm', () => {
  const renderWithFormik = (props: any) => {
    return render(
      <Formik initialValues={{ plate: '' }} onSubmit={() => {}}>
        <FieldConfirm {...props} />
      </Formik>
    );
  };

  it('shows green badge for high confidence values', () => {
    renderWithFormik({
      label: 'Plate',
      name: 'plate',
      confidence: 0.93
    });

    const badge = screen.getByText('Alta');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('auto-focuses field with low confidence', () => {
    renderWithFormik({
      label: 'Plate',
      name: 'plate',
      confidence: 0.60
    });

    const badge = screen.getByText('Baixa');
    expect(badge).toHaveClass('bg-red-100');
  });

  it('shows helper text when provided', () => {
    renderWithFormik({
      label: 'Plate',
      name: 'plate',
      confidence: 0.80,
      helper: 'Format: XX-00-XX'
    });

    expect(screen.getByText('Format: XX-00-XX')).toBeInTheDocument();
  });

  it('handles input changes', () => {
    renderWithFormik({
      label: 'Plate',
      name: 'plate',
      confidence: 0.80
    });

    const input = screen.getByLabelText('Plate');
    fireEvent.change(input, { target: { value: '12-AB-34' } });
    expect(input).toHaveValue('12-AB-34');
  });
});