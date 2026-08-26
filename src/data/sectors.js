import tickerSectors from './ticker-sectors.json' with { type: 'json' };

export const DEFAULT_SECTOR = 'Outros';

export const SECTOR_LABELS = {
  'Financial Services': 'Serviços financeiros',
  'Consumer Discretionary': 'Consumo discricionário',
  Industrials: 'Indústria',
  'Consumer Staples': 'Consumo básico',
  Insurance: 'Seguros',
  Materials: 'Materiais',
  Technology: 'Tecnologia',
  Semiconductors: 'Semicondutores',
  Healthcare: 'Saúde',
  [DEFAULT_SECTOR]: 'Outros',
};

/** @param {string} ticker */
export function lookupSector(ticker) {
  return tickerSectors[ticker] ?? DEFAULT_SECTOR;
}
