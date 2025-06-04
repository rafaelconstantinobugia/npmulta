import { useMemo, useRef, useEffect } from 'react';
import { TicketFields, CONF_THRESHOLD } from '../validation/ticketSchema';

export function useTicketForm(ocrFields: TicketFields) {
  const lowConfidenceFields = useMemo(() => {
    return Object.entries(ocrFields)
      .filter(([_, field]) => field.confidence < CONF_THRESHOLD)
      .map(([key]) => key);
  }, [ocrFields]);

  // Format initial values
  const initialValues = useMemo(() => {
    return Object.entries(ocrFields).reduce((acc, [key, field]) => ({
      ...acc,
      [key]: field.value
    }), {} as Record<keyof TicketFields, string>);
  }, [ocrFields]);

  return {
    initialValues,
    lowConfidenceFields
  };
}