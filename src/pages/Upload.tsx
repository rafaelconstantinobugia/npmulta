import React, { useState, useCallback } from 'react';
import { FileUp, CheckCircle, AlertCircle, FileText, Loader } from 'lucide-react';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import { extractTextFromFile, parseExtractedText } from '../utils/ocr';
import { DadosMulta } from '../types/multa';

const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');


  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const validateFile = useCallback((file: File): boolean => {
    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(extension)) {
      setError(`Tipo de ficheiro não suportado. Por favor, use ${allowedTypes.join(', ')}.`);
      return false;
    }

    // Check file size
    if (file.size > MAX_SIZE_BYTES) {
      setError(`O ficheiro é demasiado grande. O tamanho máximo permitido é ${MAX_SIZE_MB}MB.`);
      return false;
    }

    return true;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    if (!validateFile(droppedFile)) {
      return;
    }

    processFile(droppedFile);
  }, [processFile, validateFile]);

  const processFile = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setProcessingStage('Analisando o ficheiro...');
      
      // Extract text from file using OCR
      setProcessingStage('Extraindo texto...');
      const text = await extractTextFromFile(file);
      setExtractedText(text);
      
      // Parse the extracted text to get structured data
      setProcessingStage('Identificando dados...');
      const parsedData = parseExtractedText(text);
      
      // For the demo, we'll add a fake name since OCR might not extract it
      const result: DadosMulta = {
        nomeCondutor: "João Exemplo", // Default name since OCR might not extract it
        matricula: parsedData.matricula || "00-AA-00",
        data: parsedData.data || "01-01-2025",
        hora: parsedData.hora || "14:32",
        local: parsedData.local || "A1 km 145",
        infracao: parsedData.infracao || "Excesso de velocidade"
      };
      
      setSuccess(true);
      setLoading(false);
      
      // Short delay for better UX, showing the success state before navigating
      setTimeout(() => {
        navigate('/review', { state: result });
      }, 1500);
    } catch (error) {
      setLoading(false);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro ao processar o ficheiro. Por favor, tente novamente.');
      }
    }
  }, [navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!validateFile(selectedFile)) {
      return;
    }

    processFile(selectedFile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <ProgressBar currentStep={1} />
          
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
            {loading ? (
              <div className="text-center py-6">
                <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-lg text-slate-700 mb-2">{processingStage}</p>
                <p className="text-sm text-slate-500">Este processo pode demorar alguns segundos...</p>
              </div>
            ) : !success ? (
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
                  Formatos aceites: PDF, JPG, PNG (máximo {MAX_SIZE_MB}MB)
                </p>
              </>
            ) : (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-green-700">
                  Ficheiro carregado com sucesso!
                </p>
                <p className="text-slate-600 mt-2">
                  A redirecionar para a página de revisão...
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {extractedText && !success && (
            <div className="mt-6">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium text-slate-900">Texto Extraído (Prévia)</h3>
                </div>
                <div className="text-sm text-slate-700 max-h-40 overflow-y-auto bg-slate-50 p-3 rounded">
                  {extractedText.substring(0, 500)}
                  {extractedText.length > 500 && '...'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;