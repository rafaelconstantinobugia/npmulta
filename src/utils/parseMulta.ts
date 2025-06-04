import { DadosMulta } from '../types/multa';

/**
 * Parses OCR text from a traffic ticket to extract relevant information
 * Uses multiple strategies to handle different ticket formats and OCR quality issues
 * 
 * @param text The raw OCR text extracted from the traffic ticket
 * @returns Object with extracted ticket data (any fields not found will be undefined)
 */
export function parseMulta(text: string): Partial<DadosMulta> {
  // Normalize text to improve matching
  // Remove extra spaces, normalize line breaks, convert to lowercase for case-insensitive matching
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  // Initialize result object
  const result: Partial<DadosMulta> = {};

  // Extract license plate (matrícula)
  result.matricula = extractMatricula(normalizedText);
  
  // Extract date
  result.data = extractDate(normalizedText);
  
  // Extract time
  result.hora = extractTime(normalizedText);
  
  // Extract location
  result.local = extractLocation(normalizedText);
  
  // Extract infraction type
  result.infracao = extractInfraction(normalizedText);

  return result;
}

/**
 * Extracts a license plate from text using various Portuguese license plate formats
 */
function extractMatricula(text: string): string | undefined {
  // Traditional format: 00-00-00, AA-00-00, 00-AA-00, 00-00-AA
  const traditionalRegex = /\b([A-Z0-9]{2})-([A-Z0-9]{2})-([A-Z0-9]{2})\b/gi;
  
  // New format: 00-AA-00
  const newFormatRegex = /\b(\d{2})-([A-Z]{2})-(\d{2})\b/gi;
  
  // Handle formats with spaces or dots instead of hyphens
  const alternativeRegex = /\b([A-Z0-9]{2})[\s.]([A-Z0-9]{2})[\s.]([A-Z0-9]{2})\b/gi;
  
  // Try all regex patterns
  const match = 
    traditionalRegex.exec(text) || 
    newFormatRegex.exec(text) || 
    alternativeRegex.exec(text);
  
  if (match) {
    // Normalize format to XX-XX-XX
    return `${match[1]}-${match[2]}-${match[3]}`.toUpperCase();
  }
  
  // Look for contextual clues
  const matriculaKeywords = [
    'matrícula', 'matricula', 'veículo', 'veiculo', 
    'viatura', 'automóvel', 'automovel'
  ];
  
  for (const keyword of matriculaKeywords) {
    const keywordIndex = text.toLowerCase().indexOf(keyword);
    if (keywordIndex !== -1) {
      // Look for pattern in the next 20 characters
      const segment = text.substring(keywordIndex, keywordIndex + 30);
      
      // Check for any pattern that looks like a license plate
      const possiblePlate = segment.match(/\b[A-Z0-9]{2}[\s.-][A-Z0-9]{2}[\s.-][A-Z0-9]{2}\b/gi);
      if (possiblePlate) {
        return possiblePlate[0].replace(/[\s.]/g, '-').toUpperCase();
      }
    }
  }
  
  return undefined;
}

/**
 * Extracts a date from text in various formats
 */
function extractDate(text: string): string | undefined {
  // Common date formats in Portuguese documents: DD-MM-YYYY, DD/MM/YYYY
  const dateRegexes = [
    /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/g,        // DD-MM-YYYY, DD/MM/YYYY
    /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})\b/g,         // DD-MM-YY, DD/MM/YY
    /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/g,         // YYYY-MM-DD, YYYY/MM/DD
  ];
  
  // Check for dates with month names
  const monthNamesRegex = /\b(\d{1,2})\s+(?:de\s+)?(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de)?\s+(\d{4}|\d{2})\b/gi;
  
  // Try all regex patterns
  for (const regex of dateRegexes) {
    const match = regex.exec(text);
    if (match) {
      // Normalize to DD-MM-YYYY format
      if (match[3].length === 2) {
        // Handle 2-digit years, assuming 20YY for years < 50, 19YY for years >= 50
        const year = parseInt(match[3]);
        const fullYear = year < 50 ? 2000 + year : 1900 + year;
        return `${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}-${fullYear}`;
      }
      
      // If the first number has 4 digits, it's likely YYYY-MM-DD format
      if (match[1].length === 4) {
        return `${match[3].padStart(2, '0')}-${match[2].padStart(2, '0')}-${match[1]}`;
      }
      
      // Standard DD-MM-YYYY
      return `${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}-${match[3]}`;
    }
  }
  
  // Try month names format
  const monthNameMatch = monthNamesRegex.exec(text);
  if (monthNameMatch) {
    const day = monthNameMatch[1].padStart(2, '0');
    const monthName = monthNameMatch[2].toLowerCase();
    let year = monthNameMatch[3];
    
    // Map month name to number
    const monthMap: {[key: string]: string} = {
      'janeiro': '01',
      'fevereiro': '02',
      'março': '03',
      'marco': '03',
      'abril': '04',
      'maio': '05',
      'junho': '06',
      'julho': '07',
      'agosto': '08',
      'setembro': '09',
      'outubro': '10',
      'novembro': '11',
      'dezembro': '12'
    };
    
    const month = monthMap[monthName] || '01';
    
    // Handle 2-digit years
    if (year.length === 2) {
      const yearNum = parseInt(year);
      year = (yearNum < 50 ? '20' : '19') + year;
    }
    
    return `${day}-${month}-${year}`;
  }
  
  // Look for contextual clues
  const dateKeywords = [
    'data', 'dia', 'ocorreu', 'ocorrência', 'ocorrencia', 
    'cometida', 'praticada', 'registada', 'registada em'
  ];
  
  for (const keyword of dateKeywords) {
    const keywordIndex = text.toLowerCase().indexOf(keyword);
    if (keywordIndex !== -1) {
      // Look for date pattern in the next 30 characters
      const segment = text.substring(keywordIndex, keywordIndex + 50);
      
      // Check for any pattern that looks like a date
      for (const regex of dateRegexes) {
        const possibleDate = segment.match(regex);
        if (possibleDate) {
          // Extract and format appropriately
          const match = regex.exec(possibleDate[0]);
          if (match) {
            return `${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}-${match[3]}`;
          }
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Extracts a time from text in various formats
 */
function extractTime(text: string): string | undefined {
  // Common time formats: HH:MM, HH.MM, HH,MM, HHhMM
  const timeRegexes = [
    /\b(\d{1,2})[:.h](\d{2})(?:\s*(?:horas?|h))?\b/gi,  // HH:MM, HH.MM, HHhMM (possibly with "horas" or "h")
    /\b(\d{1,2}),(\d{2})\b/gi,                         // HH,MM
    /\b(\d{1,2})\s*horas\s*e\s*(\d{1,2})\s*minutos\b/gi, // X horas e Y minutos
    /\b(\d{1,2})[:.](\d{2})[:.](\d{2})\b/gi,           // HH:MM:SS, HH.MM.SS (ignore seconds)
  ];
  
  // Try all regex patterns
  for (const regex of timeRegexes) {
    const match = regex.exec(text);
    if (match) {
      // Normalize to HH:MM format
      const hours = parseInt(match[1]).toString().padStart(2, '0');
      const minutes = parseInt(match[2]).toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }
  
  // Look for contextual clues
  const timeKeywords = [
    'hora', 'horas', 'às', 'as', 'pelas', 'cerca de'
  ];
  
  for (const keyword of timeKeywords) {
    const keywordIndex = text.toLowerCase().indexOf(keyword);
    if (keywordIndex !== -1) {
      // Look for time pattern in the next 20 characters
      const segment = text.substring(keywordIndex, keywordIndex + 30);
      
      // Check for any pattern that looks like a time
      for (const regex of timeRegexes) {
        const possibleTime = segment.match(regex);
        if (possibleTime) {
          const match = regex.exec(possibleTime[0]);
          if (match) {
            const hours = parseInt(match[1]).toString().padStart(2, '0');
            const minutes = parseInt(match[2]).toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          }
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Extracts the location from text using contextual clues
 */
function extractLocation(text: string): string | undefined {
  // Location context patterns
  const locationPatterns = [
    /(?:local|localidade|em|na|no|pela|artéria|arteria|via|estrada|rua|avenida|av\.)\s*[:]?\s*([\w\s,.À-ÿ-]+?)(?:\.|$|\n|,\s*(?:em|no dia|pela|pelas))/i,
    /(?:ocorrida|ocorrido|verificou-se)\s+(?:em|na|no)\s+([\w\s,.À-ÿ-]+?)(?:\.|$|\n|,\s*(?:em|no dia|pela|pelas))/i,
  ];
  
  // Road identifiers common in Portugal
  const roadIdentifiers = /\b(?:A\d+|IP\d+|IC\d+|EN\d+|N\d+)\b/i;
  const roadMatch = text.match(roadIdentifiers);
  
  if (roadMatch) {
    // Find context around the road identifier
    const roadIndex = text.indexOf(roadMatch[0]);
    const contextStart = Math.max(0, roadIndex - 20);
    const contextEnd = Math.min(text.length, roadIndex + 40);
    const context = text.substring(contextStart, contextEnd);
    
    // Extract meaningful location description
    const locationPattern = /\b((?:A\d+|IP\d+|IC\d+|EN\d+|N\d+)(?:[\s,.-]+[\w\s,.À-ÿ-]+)?(?:km\s*\d+(?:[,.]\d+)?)?)\b/i;
    const extendedMatch = context.match(locationPattern);
    
    if (extendedMatch) {
      return extendedMatch[1].trim();
    }
    
    return roadMatch[0]; // Return just the road identifier if no better context is found
  }
  
  // Try to find location using context patterns
  for (const pattern of locationPatterns) {
    const match = pattern.exec(text);
    if (match && match[1] && match[1].length > 2) {
      return match[1].trim();
    }
  }
  
  // Fallback: look for any address-like pattern
  const addressPattern = /\b(?:rua|avenida|av\.|r\.|praça|praca|largo|travessa)\s+([\w\s,.À-ÿ-]+?)(?:,|\.|$|\n)/i;
  const addressMatch = addressPattern.exec(text);
  
  if (addressMatch && addressMatch[1] && addressMatch[1].length > 3) {
    return addressMatch[0].trim();
  }
  
  return undefined;
}

/**
 * Extracts the infraction type from text using keywords and context
 */
function extractInfraction(text: string): string | undefined {
  // Common infraction keywords and descriptions in Portuguese traffic tickets
  const infractionMap: {[key: string]: string} = {
    'excesso de velocidade': 'Excesso de velocidade',
    'velocidade excessiva': 'Excesso de velocidade',
    'limite de velocidade': 'Excesso de velocidade',
    'ultrapassou o limite': 'Excesso de velocidade',
    'álcool': 'Condução sob influência de álcool',
    'alcool': 'Condução sob influência de álcool',
    'taxa de alcoolemia': 'Condução sob influência de álcool',
    'telemóvel': 'Utilização de telemóvel durante a condução',
    'telemovel': 'Utilização de telemóvel durante a condução',
    'aparelho radiotelefónico': 'Utilização de telemóvel durante a condução',
    'cinto': 'Não utilização do cinto de segurança',
    'estacionamento': 'Estacionamento irregular',
    'estacionou': 'Estacionamento irregular',
    'sinal de stop': 'Desrespeito da sinalização',
    'sinal vermelho': 'Desrespeito da sinalização',
    'semáforo vermelho': 'Desrespeito da sinalização',
    'semaforo': 'Desrespeito da sinalização',
    'sentido proibido': 'Circulação em sentido proibido',
    'contramão': 'Circulação em sentido proibido',
    'contramao': 'Circulação em sentido proibido',
    'seguro': 'Falta de seguro',
    'inspeção': 'Falta de inspeção periódica',
    'inspecao': 'Falta de inspeção periódica',
    'carta de condução': 'Condução sem habilitação legal',
    'sem carta': 'Condução sem habilitação legal',
    'documentação': 'Falta de documentação',
    'documentos': 'Falta de documentação',
    'mudança de direção': 'Manobra perigosa',
    'ultrapassagem': 'Manobra perigosa',
  };
  
  // Look for infraction pattern from specific markers
  const infractionPatterns = [
    /(?:contraordenação|contra-ordenação|contra ordenação|infração|infracao|coima)(?:[:]|\s+por|\s+de)?\s+([\w\s,.À-ÿ-]+?)(?:\.|$|\n|,\s*(?:em|no dia|pela|pelas))/i,
    /(?:artigo|art\.)\s+\d+[.\s,]*(?:n[.ºo]+\s+\d+)?[.\s,]*(?:do|da|código)\s+(?:da estrada|c\.e\.|ce)(?:\s+por|\s+relativa a)?\s+([\w\s,.À-ÿ-]+?)(?:\.|$|\n|,\s*(?:em|no dia|pela|pelas))/i,
  ];
  
  // Try specific patterns first
  for (const pattern of infractionPatterns) {
    const match = pattern.exec(text.toLowerCase());
    if (match && match[1] && match[1].length > 3) {
      return match[1].trim();
    }
  }
  
  // Try keyword matching
  const lowerText = text.toLowerCase();
  for (const [keyword, description] of Object.entries(infractionMap)) {
    if (lowerText.includes(keyword)) {
      // Try to get more context around the keyword
      const keywordIndex = lowerText.indexOf(keyword);
      const contextStart = Math.max(0, keywordIndex - 30);
      const contextEnd = Math.min(lowerText.length, keywordIndex + keyword.length + 50);
      const context = lowerText.substring(contextStart, contextEnd);
      
      // Look for a more specific description
      const detailPattern = new RegExp(`${keyword}\\s+(?:de|a)\\s+(\\d+[\\w\\s,.À-ÿ-]+?)(?:\\.|$|\\n)`, 'i');
      const detailMatch = detailPattern.exec(context);
      
      if (detailMatch && detailMatch[1] && detailMatch[1].length > 1) {
        return `${description} ${detailMatch[1].trim()}`;
      }
      
      return description;
    }
  }
  
  // Look for article references which often indicate infractions
  const articlePattern = /art(?:igo)?\.?\s+(\d+\.?[º°]?)(?:[-,\s]+n\.?[º°]?\s+(\d+))?(?:[-,\s]+(?:do|da)\s+(?:CE|C\.E\.|Código da Estrada|Regulamento))?/i;
  const articleMatch = articlePattern.exec(text);
  
  if (articleMatch) {
    let articleRef = `Artigo ${articleMatch[1]}`;
    if (articleMatch[2]) {
      articleRef += `, N.º ${articleMatch[2]}`;
    }
    articleRef += ' do Código da Estrada';
    return articleRef;
  }
  
  return undefined;
}