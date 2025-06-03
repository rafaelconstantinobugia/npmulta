import { DadosMulta } from '../types/multa';

export async function fakeOcr(file: File): Promise<DadosMulta> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return mock data
  return {
    nomeCondutor: "João Exemplo",
    matricula: "00-AA-00",
    data: "2025-05-01",
    hora: "14:32",
    local: "A1 km 145",
    infracao: "Excesso de velocidade"
  };
}