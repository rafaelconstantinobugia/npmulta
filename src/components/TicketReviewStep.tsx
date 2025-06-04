import React from 'react';
import { Formik, Form } from 'formik';
import { VStack, Button, Text } from '@chakra-ui/react';
import FieldConfirm from './FieldConfirm';
import { useTicketForm } from '../hooks/useTicketForm';
import { ticketSchema } from '../validation/ticketSchema';
import type { TicketFields } from '../validation/ticketSchema';

interface TicketReviewStepProps {
  ocrFields: TicketFields;
  onSubmit: (values: Record<keyof TicketFields, string>) => void;
}

const TicketReviewStep: React.FC<TicketReviewStepProps> = ({ ocrFields, onSubmit }) => {
  const { initialValues, confidences } = useTicketForm(ocrFields);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ticketSchema}
      onSubmit={(values) => {
        onSubmit(values);
      }}
    >
      {({ isValid, dirty, isSubmitting }) => (
        <Form>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="medium" mb={4}>
              Confirme os dados extraídos
            </Text>

            <FieldConfirm
              label="Matrícula"
              name="plate"
              confidence={confidences.plate}
              helper="Formato: AA-00-AA"
            />

            <FieldConfirm
              label="Data"
              name="date"
              confidence={confidences.date}
              helper="Formato: DD/MM/AAAA"
            />

            <FieldConfirm
              label="Hora"
              name="time"
              confidence={confidences.time}
              helper="Formato: HH:MM"
            />

            <FieldConfirm
              label="Valor da Multa"
              name="fineAmount"
              confidence={confidences.fineAmount}
              helper="Exemplo: 60,00 €"
            />

            {confidences.article && (
              <FieldConfirm
                label="Artigo"
                name="article"
                confidence={confidences.article}
                helper="Número do artigo do código da estrada"
              />
            )}

            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isSubmitting}
              isDisabled={!isValid || !dirty}
              mt={6}
            >
              Confirmar e Continuar
            </Button>
          </VStack>
        </Form>
      )}
    </Formik>
  );
};