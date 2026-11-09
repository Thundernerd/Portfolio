const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);
/** A YouTube video id: 11 URL-safe base64 characters. */
const VIDEO_ID = /^[\w-]{11}$/;

/** The YouTube video id a trailer URL points at, or `undefined` when it isn't a YouTube video. */
function youtubeId(url: URL): string | undefined {
	if (url.hostname === 'youtu.be') return url.pathname.slice(1);
	if (!YOUTUBE_HOSTS.has(url.hostname)) return undefined;
	if (url.pathname === '/watch') return url.searchParams.get('v') ?? undefined;
	return /^\/embed\/([^/]+)$/.exec(url.pathname)?.[1];
}

/**
 * The URL to embed a game's trailer from, or `undefined` when it can't be embedded (it isn't a
 * YouTube video), so the page links to it instead. Embeds use YouTube's privacy-enhanced
 * `youtube-nocookie.com` domain, which sets no cookies until the visitor plays the video.
 */
export function trailerEmbedUrl(trailer: string): string | undefined {
	let url: URL;
	try {
		url = new URL(trailer);
	} catch {
		return undefined;
	}
	const id = youtubeId(url);
	return id !== undefined && VIDEO_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
}
