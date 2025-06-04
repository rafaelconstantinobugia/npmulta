import React, { useEffect } from 'react';
import { Formik, Form } from 'formik';
import { useTicketForm } from '../hooks/useTicketForm';
import FieldConfirm from './FieldConfirm';
import { TicketFields, ticketSchema } from '../validation/ticketSchema';
import Button from './ui/Button';
import { FileText } from 'lucide-react';

interface TicketReviewStepProps {
  ocrFields: TicketFields;
  onSubmit: (values: Record<keyof TicketFields, string>) => void;
}

const TicketReviewStep: React.FC<TicketReviewStepProps> = ({ ocrFields, onSubmit }) => {
  const { initialValues, lowConfidenceFields } = useTicketForm(ocrFields);
  
  // Track field corrections
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.name;
    const originalValue = ocrFields[fieldName as keyof TicketFields]?.value;
    const newValue = e.target.value;
    
    if (originalValue !== newValue) {
      // Emit analytics event
      console.log('analytics.track', 'field_corrected', {
        field: fieldName,
        from: originalValue,
        to: newValue
      });
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ticketSchema}
      onSubmit={(values) => onSubmit(values)}
    >
      {({ isValid, dirty, isSubmitting }) => (
        <Form className="space-y-6">
          <FieldConfirm
            label="Matrícula"
            name="plate"
            confidence={ocrFields.plate.confidence}
            helper="Formato: XX-00-XX"
          />
          
          <FieldConfirm
            label="Data"
            name="date"
            confidence={ocrFields.date.confidence}
            helper="Formato: DD/MM/AAAA"
          />
          
          <FieldConfirm
            label="Hora"
            name="time"
            confidence={ocrFields.time.confidence}
            helper="Formato: HH:MM"
          />
          
          <FieldConfirm
            label="Valor da Multa"
            name="fineAmount"
            confidence={ocrFields.fineAmount.confidence}
            helper="Exemplo: 60,00 €"
          />
          
          {ocrFields.article && (
            <FieldConfirm
              label="Artigo"
              name="article"
              confidence={ocrFields.article.confidence}
              helper="Opcional"
            />
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="large"
              icon={<FileText className="w-5 h-5" />}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'A processar...' : 'Confirmar e Continuar'}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default TicketReviewStep;