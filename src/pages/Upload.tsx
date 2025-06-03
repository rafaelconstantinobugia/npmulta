import React, { useState, useCallback } from 'react';
import { FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { fakeOcr } from '../utils/fakeOcr';
import { DadosMulta } from '../types/multa';

const Upload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dadosMulta, setDadosMulta] = useState<DadosMulta | null>(null);

  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(extension);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    if (!validateFile(droppedFile)) {
      setError('Tipo de ficheiro não suportado. Por favor, use PDF, JPG ou PNG.');
      return;
    }

    setFile(droppedFile);
    processFile(droppedFile);
  }, []);

  const processFile = async (file: File) => {
    try {
      const dados = await fakeOcr(file);
      setDadosMulta(dados);
      setSuccess(true);
    } catch (error) {
      setError('Erro ao processar o ficheiro. Por favor, tente novamente.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!validateFile(selectedFile)) {
      setError('Tipo de ficheiro não suportado. Por favor, use PDF, JPG ou PNG.');
      return;
    }

    setFile(selectedFile);
    processFile(selectedFile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-8">
            Carregue a sua multa
          </h1>

          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}
              ${success ? 'border-green-500 bg-green-50' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Área para carregar ficheiro"
          >
            {!success ? (
              <>
                <div className="mb-4">
                  <FileUp className="w-12 h-12 text-blue-500 mx-auto" />
                </div>
                <p className="text-lg text-slate-700 mb-2">
                  Arraste e solte o seu ficheiro aqui
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  ou
                </p>
                <Button
                  variant="primary"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  Selecionar Ficheiro
                </Button>
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  aria-label="Selecionar ficheiro"
                />
                <p className="text-sm text-slate-500 mt-4">
                  Formatos aceites: PDF, JPG, PNG
                </p>
              </>
            ) : (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-green-700">
                  Ficheiro carregado com sucesso!
                </p>
                {dadosMulta && (
                  <div className="mt-4 text-left bg-white p-4 rounded-lg border border-green-200">
                    <h3 className="font-medium text-slate-900 mb-2">Dados Extraídos:</h3>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>Nome: {dadosMulta.nomeCondutor}</p>
                      <p>Matrícula: {dadosMulta.matricula}</p>
                      <p>Data: {dadosMulta.data}</p>
                      <p>Hora: {dadosMulta.hora}</p>
                      <p>Local: {dadosMulta.local}</p>
                      <p>Infração: {dadosMulta.infracao}</p>
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFile(null);
                    setSuccess(false);
                    setDadosMulta(null);
                  }}
                >
                  Carregar outro ficheiro
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;