exports.TITLE_HEIGHT = 36;
// Core = filter + split
exports.DIMENSION_HEIGHT = 27;
exports.MEASURE_HEIGHT = 27;
exports.CORE_ITEM_WIDTH = 192;
exports.CORE_ITEM_GAP = 8;
exports.BAR_TITLE_WIDTH = 66;
exports.PIN_TITLE_HEIGHT = 36;
exports.PIN_ITEM_HEIGHT = 25;
exports.PIN_PADDING_BOTTOM = 12;
exports.VIS_H_PADDING = 10;
exports.SPLIT = 'SPLIT';
exports.MAX_SEARCH_LENGTH = 300;
exports.SEARCH_WAIT = 900;
exports.STRINGS = {
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
var EN_US = {
    shortDays: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    shortMonths: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    weekStart: 0
};
function getLocale() {
    return EN_US;
}
exports.getLocale = getLocale;
//# sourceMappingURL=constants.js.map