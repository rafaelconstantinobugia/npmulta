import { DadosMulta } from '../types/multa';
const MONTH_MAP: Record<string, string> = {
janeiro: '01', fevereiro: '02', março: '03', marco: '03',
abril: '04', maio: '05', junho: '06', julho: '07',
agosto: '08', setembro: '09', outubro: '10',
novembro: '11', dezembro: '12',
};
export function parseMulta(text: string): Partial<DadosMulta> {
const normalizedText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
const lower = normalizedText.toLowerCase();
const result: Partial<DadosMulta> = {};
result.matricula = extractMatricula(normalizedText);
result.data = extractDate(normalizedText);
result.hora = extractTime(normalizedText);
result.local = extractLocation(normalizedText);
result.infracao = extractInfraction(normalizedText);
result.condutor = extractCondutor(normalizedText);
return result;
}
function extractMatricula(text: string): string | undefined {
const patterns = [
/\b([A-Z0-9]{2})[-]([A-Z0-9]{2})[-]([A-Z0-9]{2})\b/,
/\b(\d{2})[-]([A-Z]{2})[-](\d{2})\b/,
/\b([A-Z0-9]{2})[\s\.\-]([A-Z0-9]{2})[\s\.\-]([A-Z0-9]{2})\b/
];
for (const pattern of patterns) {
const match = text.match(pattern);
if (match) {
return \`\${match[1]}-\${match[2]}-\${match[3]}\`.toUpperCase();
}
}
return undefined;
}
function extractDate(text: string): string | undefined {
const regexes = [
/\b(\d{1,2})[-/\.](\d{1,2})[-/\.]?(\d{2,4})\b/,
/\b(\d{4})[-/\.](\d{1,2})[-/\.](\d{1,2})\b/
];
for (const regex of regexes) {
const match = text.match(regex);
if (match) {
let [_, d1, d2, d3] = match;
if (d3.length === 2) {
const year = parseInt(d3) < 50 ? '20' + d3 : '19' + d3;
return \`\${d1.padStart(2, '0')}-\${d2.padStart(2, '0')}-\${year}\`;
}
return \`\${d1.padStart(2, '0')}-\${d2.padStart(2, '0')}-\${d3}\`;
}
}
const monthRegex = /\b(\d{1,2})\s+(?:de\s+)?([a-zçãé]+)(?:\s+de)?\s+(\d{2,4})\b/i;
const match = text.match(monthRegex);
if (match) {
let [_, day, month, year] = match;
if (year.length === 2) year = parseInt(year) < 50 ? '20' + year : '19' + year;
return \`\${day.padStart(2, '0')}-\${MONTH_MAP[month.toLowerCase()] || '01'}-\${year}\`;
}
return undefined;
}
function extractTime(text: string): string | undefined {
const regexes = [
/\b(\d{1,2})[:\.h](\d{2})\b/,
/\b(\d{1,2})[,](\d{2})\b/
];
for (const regex of regexes) {
const match = text.match(regex);
if (match) {
const [_, h, m] = match;
return \`\${h.padStart(2, '0')}:\${m.padStart(2, '0')}\`;
}
}
return undefined;
function extractLocation(text: string): string | undefined {
const match = text.match(/(?:local|em|na|no)[:\s]+([\w\s,\.À-ÿ-]{4,30})/i);
return match ? match[1].trim() : undefined;
}
}
function extractInfraction(text: string): string | undefined {
const keywords: { [key: string]: string } = {
'velocidade': 'Excesso de velocidade',
'alcool': 'Condução sob álcool',
'telemovel': 'Uso de telemóvel',
'cinto': 'Sem cinto de segurança',
'estacionamento': 'Estacionamento irregular'
};
const lower = text.toLowerCase();
for (const key in keywords) {
if (lower.includes(key)) return keywords[key];
}
return undefined;
}
function extractCondutor(text: string): string | undefined {
const keywords = ['condutor', 'nome', 'infrator', 'infractor', 'arguido', 'identificado como'];
for (const keyword of keywords) {
const regex = new RegExp(`${keyword}\s*[:\-–]?\s*([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][\w\s\-']{3,50})`, 'i');
const match = regex.exec(text);
if (match && match[1]) {
let name = match[1].trim();
name = name.replace(/\s+(morada|n[ºo]\.?|documento|com|natural).*/i, '').trim();
return name;
}
}
return undefined;
}