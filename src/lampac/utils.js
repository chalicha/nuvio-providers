export function buildQueryString(tmdbId, mediaType, meta) {
    var serial = (mediaType === 'tv' || mediaType === 'show') ? 1 : 0;
    return [
        'id=' + encodeURIComponent(tmdbId),
        'title=' + encodeURIComponent((meta && meta.title) || ''),
        'original_title=' + encodeURIComponent((meta && meta.title) || ''),
        'serial=' + serial,
        'year=' + encodeURIComponent((meta && meta.year) || '0000'),
        'source=tmdb', 'clarification=0', 'similar=false', 'rchtype='
    ].join('&');
}
