export async function fetchStreamUrl(callUrl) {
    try {
        var r = await fetch(callUrl, { headers: { 'X-Kit-AesGcm': '' } });
        if (!r.ok) return null;
        var json = await r.json();
        if (!json || json.rch || !json.url) return null;
        var url = json.url.indexOf(' or ') !== -1 ? json.url.split(' or ')[0] : json.url;
        return { url: url, headers: json.headers || {}, quality: json.quality || {} };
    } catch(e) { return null; }
}
