'use strict';

function buildQueryString(tmdbId, mediaType, meta) {
    var serial = (mediaType === 'tv' || mediaType === 'show') ? 1 : 0;
    return [
        'id=' + encodeURIComponent(tmdbId),
        'title=' + encodeURIComponent((meta && meta.title) || ''),
        'original_title=' + encodeURIComponent((meta && meta.title) || ''),
        'serial=' + serial,
        'year=' + encodeURIComponent((meta && meta.year) || '0000'),
        'source=tmdb',
        'clarification=0',
        'similar=false',
        'rchtype='
    ].join('&');
}

function parseHtmlStreams(html) {
    var items = [];
    var regex = /data-json="([^"]+)"/g;
    var match;
    while ((match = regex.exec(html)) !== null) {
        try {
            var data = JSON.parse(
                match[1]
                    .replace(/&quot;/g, '"')
                    .replace(/&#34;/g, '"')
                    .replace(/&amp;/g, '&')
            );
            if (!data.url && data.method !== 'call') continue;
            var url = (data.url || '');
            if (url.indexOf(' or ') !== -1) url = url.split(' or ')[0];
            var quality = '';
            if (data.quality && typeof data.quality === 'object') {
                var keys = Object.keys(data.quality);
                if (keys.length) quality = keys[keys.length - 1] + 'p';
            } else if (typeof data.quality === 'string') {
                quality = data.quality;
            }
            items.push({
                method: data.method || 'play',
                url: url,
                title: data.title || data.text || quality || '',
                quality: quality,
                voiceName: data.voice_name || data.translation || '',
                headers: data.headers || {}
            });
        } catch(e) {}
    }
    return items;
}

async function fetchStreamUrl(callUrl) {
    try {
        var r = await fetch(callUrl, { headers: { 'X-Kit-AesGcm': '' } });
        if (!r.ok) return null;
        var json = await r.json();
        if (!json || json.rch || !json.url) return null;
        var url = json.url.indexOf(' or ') !== -1
            ? json.url.split(' or ')[0]
            : json.url;
        return { url: url, headers: json.headers || {}, quality: json.quality || {} };
    } catch(e) {
        return null;
    }
}

async function fetchBalancers(baseUrl, tmdbId, mediaType) {
    var url = baseUrl + '/lite/events?life=false&' + buildQueryString(tmdbId, mediaType, {});
    var r = await fetch(url, { headers: { 'X-Kit-AesGcm': '' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    var json = await r.json();
    var list = Array.isArray(json) ? json : (json.online || []);
    return list.filter(function(b) { return b && b.url; });
}

async function fetchFromBalancer(balancerUrl, tmdbId, mediaType, season, episode) {
    var url = balancerUrl
        + (balancerUrl.indexOf('?') >= 0 ? '&' : '?')
        + buildQueryString(tmdbId, mediaType, {});
    if (season) url += '&s=' + season + '&e=' + (episode || 1);

    var r = await fetch(url, { headers: { 'X-Kit-AesGcm': '' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    var text = await r.text();

    try {
        var j = JSON.parse(text);
        if (j && j.rch) return [];
    } catch(e) {}

    var items = parseHtmlStreams(text);
    var resolved = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.method === 'play' && item.url) {
            resolved.push({
                name: 'Lampac',
                title: item.title,
                url: item.url,
                quality: item.quality,
                voiceName: item.voiceName,
                headers: item.headers
            });
        } else if (item.method === 'call' && item.url) {
            var stream = await fetchStreamUrl(item.url);
            if (stream) {
                resolved.push({
                    name: 'Lampac',
                    title: item.title,
                    url: stream.url,
                    quality: item.quality,
                    voiceName: item.voiceName,
                    headers: stream.headers
                });
            }
        }
    }
    return resolved;
}

var BASE_URL = 'https://bwa.to';

async function getStreams(tmdbId, mediaType, season, episode) {
    console.log('[Lampac] Request:', mediaType, tmdbId);
    try {
        var balancers = await fetchBalancers(BASE_URL, tmdbId, mediaType);
        if (!balancers || balancers.length === 0) return [];

        var allStreams = [];
        for (var i = 0; i < balancers.length; i++) {
            var b = balancers[i];
            if (!b.show) continue;
            try {
                var streams = await fetchFromBalancer(b.url, tmdbId, mediaType, season, episode);
                streams.forEach(function(s) {
                    s.name = b.name + (s.voiceName ? ' · ' + s.voiceName : '');
                });
                allStreams = allStreams.concat(streams);
            } catch(e) {
                console.log('[Lampac] Balancer error (' + b.name + '):', e.message);
            }
        }
        return allStreams;
    } catch(e) {
        box.error('[Lampac] Error:', e.message);
        return [];
    }
}

module.exports = { getStreams };
