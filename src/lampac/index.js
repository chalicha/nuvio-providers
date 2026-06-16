import { createApi } from './api.js';

var BASE_URL = 'https://bwa.to'; // შეცვალე საკუთარი სერვერით თუ გაქვს

async function getStreams(tmdbId, mediaType, season, episode) {
    console.log('[Lampac] Request:', mediaType, tmdbId);
    var api = createApi(BASE_URL);
    try {
        var balancers = await api.fetchBalancers(tmdbId, mediaType);
        if (!balancers || balancers.length === 0) return [];
        
        var allStreams = [];
        for (var i = 0; i < balancers.length; i++) {
            var b = balancers[i];
            if (!b.show) continue;
            try {
                var streams = await api.fetchFromBalancer(b.url, tmdbId, mediaType, season, episode);
                streams.forEach(function(s) { s.name = b.name + (s.voiceName ? ' · ' + s.voiceName : ''); });
                allStreams = allStreams.concat(streams);
            } catch(e) { console.log('[Lampac] Balancer error:', e.message); }
        }
        return allStreams;
    } catch(e) {
        console.error('[Lampac] Error:', e.message);
        return [];
    }
}

module.exports = { getStreams };
