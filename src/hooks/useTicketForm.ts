import { useMemo } from 'react';
import type { TicketFields } from '../validation/ticketSchema';

export function useTicketForm(ocrFields: TicketFields) {
  return useMemo(() => {
    const initialValues: Record<keyof TicketFields, string> = {
      plate: ocrFields.plate.value,
      date: ocrFields.date.value,
      time: ocrFields.time.value,
      fineAmount: ocrFields.fineAmount.value,
      article: ocrFields.article?.value || ''
    };

    const confidences: Record<keyof TicketFields, number> = {
      plate: ocrFields.plate.confidence,
      date: ocrFields.date.confidence,
      time: ocrFields.time.confidence,
      fineAmount: ocrFields.fineAmount.confidence,
      article: ocrFields.article?.confidence || 0
    };

    return { initialValues, confidences };
  }, [ocrFields]);
}