import React, { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Box, Badge } from '@chakra-ui/react';

interface ConfigEditorProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  isDirty: boolean;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({
  value,
  onChange,
  isValid,
  isDirty
}) => {
  const handleEditorChange = useCallback((value: string | undefined) => {
    onChange(value || '');
  }, [onChange]);

  return (
    <Box position="relative">
      <Box position="absolute" top={2} right={2} zIndex={1}>
        <Badge colorScheme={isDirty ? 'yellow' : 'green'}>
          {isDirty ? 'Não Guardado' : 'Guardado'}
        </Badge>
      </Box>
      <Editor
        height="400px"
        defaultLanguage="json"
        value={value}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          readOnly: !isValid
        }}
        theme="vs-light"
      />
    </Box>
  );
};

export default ConfigEditor;