import React from 'react';
import { useField } from 'formik';
import { Input, InputGroup, InputLeftElement, FormControl, FormLabel, FormErrorMessage, Badge, Tooltip } from '@chakra-ui/react';

interface FieldConfirmProps {
  label: string;
  name: string;
  confidence: number;
  helper?: string;
}

const FieldConfirm: React.FC<FieldConfirmProps> = ({ label, name, confidence, helper }) => {
  const [field, meta] = useField(name);
  
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'green';
    if (conf >= 0.75) return 'yellow';
    return 'red';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.9) return 'Alta';
    if (conf >= 0.75) return 'Verificar';
    return 'Baixa';
  };

  const confidenceColor = getConfidenceColor(confidence);
  const confidenceLabel = getConfidenceLabel(confidence);
  const confidencePercentage = Math.round(confidence * 100);

  return (
    <FormControl isInvalid={meta.touched && !!meta.error}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <InputGroup>
        <InputLeftElement pointerEvents="none" width="auto" pl={2}>
          <Tooltip 
            label={`Confiança ${confidencePercentage}% - ${helper || 'Verifique se o valor está correto'}`}
            placement="top"
          >
            <Badge colorScheme={confidenceColor} ml={2}>
              {confidenceLabel} {confidencePercentage}%
            </Badge>
          </Tooltip>
        </InputLeftElement>
        <Input
          {...field}
          id={name}
          pl="100px"
          autoFocus={confidence < 0.75}
          borderColor={confidence < 0.75 ? 'red.300' : undefined}
        />
      </InputGroup>
      <FormErrorMessage role="alert">{meta.error}</FormErrorMessage>
    </FormControl>
  );
};

export default FieldConfirm;