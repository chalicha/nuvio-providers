import { buildQueryString } from './utils.js';
import { parseHtmlStreams } from './parser.js';
import { fetchStreamUrl } from './resolver.js';

export function createApi(baseUrl) {
    return {
        fetchBalancers: async function(tmdbId, mediaType) {
            var url = baseUrl + '/lite/events?life=false&' + buildQueryString(tmdbId, mediaType, {});
            var r = await fetch(url, { headers: { 'X-Kit-AesGcm': '' } });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            var json = await r.json();
            var list = Array.isArray(json) ? json : (json.online || []);
            return list.filter(function(b) { return b && b.url; });
        },
        fetchFromBalancer: async function(balancerUrl, tmdbId, mediaType, season, episode) {
            var url = balancerUrl + (balancerUrl.indexOf('?') >= 0 ? '&' : '?') + buildQueryString(tmdbId, mediaType, {});
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
                    resolved.push({ name: 'Lampac', title: item.title, url: item.url, quality: item.quality, voiceName: item.voiceName, headers: item.headers });
                } else if (item.method === 'call' && item.url) {
                    var stream = await fetchStreamUrl(item.url);
                    if (stream) resolved.push({ name: 'Lampac', title: item.title, url: stream.url, quality: item.quality, voiceName: item.voiceName, headers: stream.headers });
                }
            }
            return resolved;
        }
    };
}
