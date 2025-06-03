export interface DadosMulta {
  nomeCondutor: string;
  matricula: string;
  data: string;
  hora: string;
  local: string;
  infracao: string;
}

export interface OcrResult {
  text: string;
  parsedData: Partial<DadosMulta>;
}