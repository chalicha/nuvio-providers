function getStreams(tmdbId, mediaType, season, episode) {
  console.log("[BWARC] Searching for:", tmdbId);

  return Promise.resolve([
    {
      name: "BWARC Test",
      title: "Test Stream 1080p",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      quality: "1080p"
    }
  ]);
}

module.exports = { getStreams };
