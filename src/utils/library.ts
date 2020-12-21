import loggerFactory from '../middlewares/WinstonLogger';

export function calculateAfcEsclateCredits(pageString: string) {
    const logger = loggerFactory('library', 'calculateAfcEscalationCredits');
    try {
    let pages = pageString.split(',');
    let pageCount = 0;
    pages.map(p => {
        p = p.trim();
        const pageRange = p.split('-');
        if (pageRange.length === 2) {
            pageCount += parseInt(pageRange[1]) + 1 - parseInt(pageRange[0]); // the page range is assumed to be inclusive
        } else {
            pageCount += parseInt(p);
        }
    });
    return pageCount;
} catch (error) {
    logger.error('couldn\'t get escalation credits.');
}

    return -1;
}

export function doesListContainElement(list: string[] | undefined, element: string) {
    if(list === undefined)
    return false;
    const normalizedList = list.map(item => normalizeString(item));

    return normalizedList.includes(normalizeString(element));
}

export function normalizeString(item: string) {
    return item.toLowerCase().replace(/ /g, '');
}
