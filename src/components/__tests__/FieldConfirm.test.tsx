import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import FieldConfirm from '../FieldConfirm';
import '@testing-library/jest-dom';

const renderWithFormik = (ui: React.ReactNode, initialValues = {}) => {
  return render(
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      {ui}
    </Formik>
  );
};

describe('FieldConfirm', () => {
  it('renders with high confidence correctly', () => {
    renderWithFormik(
      <FieldConfirm
        label="Matrícula"
        name="plate"
        confidence={0.93}
        helper="Formato: AA-00-AA"
      />,
      { plate: '12-AB-34' }
    );

    expect(screen.getByText('Alta 93%')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('12-AB-34');
  });

  it('shows red badge and autofocuses with low confidence', () => {
    renderWithFormik(
      <FieldConfirm
        label="Matrícula"
        name="plate"
        confidence={0.60}
        helper="Formato: AA-00-AA"
      />,
      { plate: '12-A8-34' }
    );

    const input = screen.getByRole('textbox');
    expect(screen.getByText('Baixa 60%')).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('shows error message when invalid', async () => {
    renderWithFormik(
      <FieldConfirm
        label="Matrícula"
        name="plate"
        confidence={0.85}
        helper="Formato: AA-00-AA"
      />,
      { plate: '32-ZZ-99x' }
    );

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});