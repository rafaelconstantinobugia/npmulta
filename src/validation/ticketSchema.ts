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
    .matches(/^\d+([,\.]\d{2})? *€?$/, 'Valor em €')
    .required('Valor é obrigatório'),
  article: yup.string().optional()
});

export function validateTicketFields(fields: TicketFields) {
  const errors: Record<keyof TicketFields, string | undefined> = {
    plate: undefined,
    date: undefined,
    time: undefined,
    fineAmount: undefined,
    article: undefined
  };

  const lowConfidence: (keyof TicketFields)[] = [];

  // Check confidence levels
  Object.entries(fields).forEach(([key, field]) => {
    if (field.confidence < CONF_THRESHOLD) {
      lowConfidence.push(key as keyof TicketFields);
    }
  });

  // Validate values
  try {
    ticketSchema.validateSync({
      plate: fields.plate.value,
      date: new Date(fields.date.value),
      time: fields.time.value,
      fineAmount: fields.fineAmount.value,
      article: fields.article?.value
    }, { abortEarly: false });
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      err.inner.forEach((error) => {
        if (error.path) {
          errors[error.path as keyof TicketFields] = error.message;
        }
      });
    }
  }

  return {
    isValid: Object.values(errors).every(error => !error),
    errors,
    lowConfidence
  };
}