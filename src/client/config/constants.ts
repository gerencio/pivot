import { $, SortAction } from 'plywood';
import { Locale } from '../../common/utils/time/time';

export const TITLE_HEIGHT = 36;

// Core = filter + split
export const DIMENSION_HEIGHT = 27;
export const MEASURE_HEIGHT = 27;
export const CORE_ITEM_WIDTH = 192;
export const CORE_ITEM_GAP = 8;
export const BAR_TITLE_WIDTH = 66;

export const PIN_TITLE_HEIGHT = 36;
export const PIN_ITEM_HEIGHT = 25;
export const PIN_PADDING_BOTTOM = 12;
export const VIS_H_PADDING = 10;

export const SPLIT = 'SPLIT';

export const MAX_SEARCH_LENGTH = 300;
export const SEARCH_WAIT = 900;

export const STRINGS = {
  dimensions: 'Dimensões',
  measures: 'Medidas',
  filter: 'Filtro',
  split: 'Split',
  subsplit: 'Split',
  sortBy: 'Ordenar por',
  limit: 'Limite',
  pin: 'Pin',
  pinboard: 'Pinboard',
  pinboardPlaceholder: 'Clique ou arraste as dimensões para \"pinnar\"',
  granularity: 'Granularidade',
  relative: 'Relativo',
  specific: 'Específico',
  latest: 'Últimos',
  current: 'Atual',
  previous: 'Anterior',
  start: 'Início',
  end: 'Fim',
  ok: 'OK',
  select: 'Select',
  cancel: 'Cancel',
  close: 'Close',
  queryError: 'Erro na consulta',
  autoUpdate: 'update Automático',
  download: 'Download',
  copyUrl: 'Copiar URL',
  viewRawData: 'Visualizar os dados',
  rawData: 'Todos os Dados',
  copySpecificUrl: 'Copiar URL - data fixa',
  logout: 'Sair',
  infoAndFeedback: 'Info & Feedback',
  copyValue: 'Copiar valor',
  goToUrl: 'Ir para URL',
  openIn: 'Aberto em',
  segment: 'segmento',
  exportToCSV: 'Exportar paraCSV',
  updateTimezone: 'Alterar Timezone',
  timezone: 'Timezone',
  splitDelimiter: 'por'
};


const EN_US: Locale = {
  shortDays: [ "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb" ],
  shortMonths: [ "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez" ],
  weekStart: 0
};

export function getLocale(): Locale {
  return EN_US;
}
