import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Handlebars from 'handlebars';

export function registerHelpers() {
  Handlebars.registerHelper('money', (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,.]/g, '').replace(',', '.')) : value;
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  });

  Handlebars.registerHelper('date_pt', (isoDate: string) => {
    const date = new Date(isoDate);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: pt });
  });

  Handlebars.registerHelper('upper', (text: string) => {
    return text.toLocaleUpperCase('pt-PT');
  });
}