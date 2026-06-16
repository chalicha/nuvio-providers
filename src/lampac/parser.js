export function parseHtmlStreams(html) {
    var items = [];
    var regex = /data-json="([^"]+)"/g;
    var match;
    while ((match = regex.exec(html)) !== null) {
        try {
            var data = JSON.parse(match[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
            if (!data.url && data.method !== 'call') continue;
            var url = (data.url || '');
            if (url.indexOf(' or ') !== -1) url = url.split(' or ')[0];
            var quality = '';
            if (data.quality && typeof data.quality === 'object') {
                var keys = Object.keys(data.quality);
                if (keys.length) quality = keys[keys.length-1] + 'p';
            } else if (typeof data.quality === 'string') quality = data.quality;
            items.push({ method: data.method || 'play', url: url, title: data.title || quality || '', quality: quality, voiceName: data.voice_name || '', headers: data.headers || {} });
        } catch(e) {}
    }
    return items;
}
