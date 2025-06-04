import * as yup from 'yup';

export interface TicketFields {
  plate: { value: string; confidence: number };
  date: { value: string; confidence: number };
  time: { value: string; confidence: number };
  fineAmount: { value: string; confidence: number };
  article?: { value: string; confidence: number };
}

export const CONF_THRESHOLD = 0.75;

export const ticketSchema = yup.object({
  plate: yup.string()
    .matches(/^[A-Z]{2}-\d{2}-[A-Z]{2}$/i, 'Matrícula inválida')
    .required('Matrícula é obrigatória'),
  date: yup.date()
    .max(new Date(), 'Data não pode ser no futuro')
    .required('Data é obrigatória'),
  time: yup.string()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM')
    .required('Hora é obrigatória'),
  fineAmount: yup.string()
    .matches(/^\d+([,.]\d{2})? *€?$/, 'Valor em €')
    .required('Valor é obrigatório'),
  article: yup.string()
    .optional()
});

export function validateTicketFields(fields: TicketFields) {
  const values = Object.entries(fields).reduce((acc, [key, field]) => ({
    ...acc,
    [key]: field.value
  }), {});

  let isValid = false;
  let errors: Record<keyof TicketFields, string | undefined> = {
    plate: undefined,
    date: undefined,
    time: undefined,
    fineAmount: undefined,
    article: undefined
  };

  try {
    ticketSchema.validateSync(values, { abortEarly: false });
    isValid = true;
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      err.inner.forEach((error) => {
        if (error.path) {
          errors[error.path as keyof TicketFields] = error.message;
        }
      });
    }
  }

  // Check confidence levels
  const lowConfidence = Object.entries(fields)
    .filter(([key, field]) => field.confidence < CONF_THRESHOLD)
    .map(([key]) => key as keyof TicketFields);

  return {
    isValid,
    errors,
    lowConfidence
  };
}