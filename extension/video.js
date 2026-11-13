// Tufan Download Manager's download button over videos (a content script, in every page and
// frame). Our own design: a small pill at the video's edge that appears while the pointer is
// over the video (or it has the keyboard's focus) and fades when the pointer rests or leaves.
// Clicking it opens the app's Download video window for this page (an embedded player's own
// address, which yt-dlp understands), with the video's own address when it has a plain one. It can be dragged along the video's edge, and stays where
// it was put on that site. Its menu hides it on this video, keeps it off the site (the app's
// Options → General → Download panels lists those sites), or opens those settings. The app
// decides where it may show at all (the native host: integration on, this browser captured,
// the button on, the site not excluded).
(() => {
  // One button per page: a copy cut off from the extension (after an update) gives way to the
  // new one.
  const prev = globalThis.__mdmVideoButton;
  if (prev && typeof prev === "object" && prev.alive()) return;
  if (prev && typeof prev.teardown === "function") prev.teardown();
  const ext = globalThis.browser ?? globalThis.chrome;

  // A video worth a button: big enough to be content, not a short muted looping clip (an
  // animated picture or a background). A sound player (<audio> with controls) gets one too.
  const MIN_W = 200;
  const MIN_H = 112;
  const MIN_AUDIO_H = 24;
  const CLIP_S = 15;
  // Shown this long after the pointer last moved over the video, kept while it is on the button.
  const IDLE_MS = 2600;
  const INSET = 10;
  const DRAG_PX = 4;
  // Our app icon (extension/icons/tdm-icon-48.png, as data: no extension file is exposed to pages).
  const LOGO = "data:image/png;base64,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";

  const t = (key, ...subs) => ext.i18n.getMessage(key, subs) || FALLBACK[key] || key;
  const FALLBACK = {
    video_download: "Download video",
    video_more: "More options",
    video_hide_here: "Hide on this video",
    video_settings: "Button settings...",
    video_sent: "Sent to Tufan Download Manager",
    video_failed: "Tufan Download Manager isn't installed or didn't start",
    video_off: "The download button is off on this site",
    video_drm: "Protected video: it can't be saved",
    video_unnamed: "Can't tell which video this is: open its own page and try there",
    video_open_post: "Open the post, then use the button there",
    video_drag: "Drag to move it along the video's edge",
  };
  // To the background. After the extension was updated or removed, this page's copy of the script
  // is cut off from it (calls throw at once): then it takes itself away.
  const send = (m) => {
    try {
      if (!ext.runtime?.id) throw new Error("gone");
      return ext.runtime.sendMessage(m).catch(() => ({ ok: false }));
    } catch {
      teardown();
      return Promise.resolve({ ok: false, gone: true });
    }
  };
  const host = location.hostname;
  // The address the app looks the video up by — the video's, not the page's. Most pages that play
  // a video are not the video's page: YouTube's home, a search, a channel or a playlist carries a
  // list in its address ("recommended", the results, the channel's videos), and yt-dlp reads such
  // an address as the list, so the app offered the whole feed instead of the video the button was
  // on. A watch page opened from a mix or a playlist has the same problem one level down
  // (…&list=…&index=…): its own page is watch?v=<id>, and nothing else.
  //
  // Null when the page plays a video but its DOM doesn't name it: YouTube's channel masthead player
  // has no video-id attribute, no link to the video inside the player and a blob: source. The page
  // itself never goes to the app then (a channel is a whole list to yt-dlp): the background asks
  // the player what it plays, in the page's own world (background.js playingVideo), and this
  // answer is only what it falls back on.
  //
  // Elsewhere the same, generalised (#689, #643): a video in a feed (LinkedIn's, Facebook's, X's,
  // Reddit's…) sits in the post it belongs to, and that post names its own address (its
  // permalink, its timestamp link, the post id the page gives it); `ownAddress` finds it the way
  // a person would. Null there too when nothing names it: a feed's address is never the video's.
  //
  // ---- the video's own address: from here to its end mark, run as is on saved pages by
  // tools/extension/test.mjs (only `location`, `document` and the elements' parentElement,
  // parentNode.host, localName, getAttribute, querySelector(All) with simple selectors).
  function videoPage(v) {
    const watch = (id) =>
      /^[\w-]+$/.test(id || "") ? `https://www.youtube.com/watch?v=${id}` : null;
    try {
      const url = new URL(location.href);
      const name = url.hostname.replace(/^(www|m|music)\./, "");
      if (name === "youtu.be") {
        const id = url.pathname.split("/")[1];
        if (watch(id)) return `https://youtu.be/${id}`;
      }
      if (name === "youtube.com" || name === "youtube-nocookie.com") {
        // An embed's own page is the video's (…/embed/<id>).
        if (url.pathname.startsWith("/embed/")) {
          const id = watch(url.pathname.split("/")[2]);
          if (id) return id;
        }
        // A Short's or a live stream's own page (/shorts/<id>, /live/<id>). yt-dlp reads these as
        // the same one video as watch?v=<id>.
        const [, kind, pathId] = url.pathname.split("/");
        if (kind === "shorts" || kind === "live") {
          const id = watch(pathId);
          if (id) return id;
        }
        // The page is this video's own: a watch page, with or without a list on it.
        const own = watch(url.searchParams.get("v"));
        if (own && url.pathname.startsWith("/watch")) return own;
        const shown = watch(document.querySelector("ytd-watch-flexy")?.getAttribute("video-id"));
        if (shown && url.pathname.startsWith("/watch")) return shown;
        const player = watch(document.querySelector("#movie_player")?.getAttribute("video-id"));
        if (player) return player;
        // A player inside the card it belongs to (a feed, a search, a playlist): the card links to
        // the video. Only a container that names exactly one video counts — walking on into the
        // page's column would find some other card's link and send the wrong video, which is worse
        // than sending none.
        for (let node = v, i = 0; node && i < 12; i += 1, node = node.parentElement) {
          const ids = new Set();
          for (const a of node.querySelectorAll?.('a[href*="/watch?"], a[href*="youtu.be/"]') || []) {
            const link = new URL(a.href, location.href);
            const id = link.hostname.endsWith("youtu.be")
              ? link.pathname.split("/")[1]
              : link.searchParams.get("v");
            if (watch(id)) ids.add(id);
          }
          if (ids.size === 1) return watch([...ids][0]);
          if (ids.size > 1) break;
        }
        // A page that plays a video and names none: not the video's page, so not the app's.
        return null;
      }
      return ownAddress(v, url);
    } catch {
      // Not an address this page can reason about: its own follows.
    }
    return location.href;
  }

  // Up from a node: its parent, or the element whose shadow root holds it (Reddit's player keeps
  // its <video> in one).
  const upFrom = (n) => n.parentElement || (n.parentNode && n.parentNode.host) || null;

  // `href` as an address (relative to the page), or null.
  function linkTo(href) {
    try {
      return href ? new URL(href, location.href) : null;
    } catch {
      return null;
    }
  }

  // The nearest container around the video that names its post: `read(node)` gives what a
  // container names, { sure, maybe } (Maps of an id to the address it stands for), `sure` the
  // post's or the video's own ids, `maybe` weaker ones (a link that may be the post's). The
  // innermost container naming anything decides, and only when it names exactly one: one naming
  // two has taken in the next post or the page's column, and a wrong video is worse than none.
  // The walk ends at the page's column (a feed, role="feed") and at a container holding another
  // video: from there up, what it names may be that one's (a post naming nothing next to one
  // that names its own). A page that breaks a reader's expectations names nothing (never the
  // page's own address instead).
  function nearest(v, read) {
    try {
      for (let node = v, i = 0; node && i < 16; i += 1, node = upFrom(node)) {
        if (node.localName === "body" || node.localName === "html") break;
        if (node !== v && (node.getAttribute?.("role") === "feed" || manyVideos(node))) break;
        const { sure, maybe } = read(node);
        if (sure.size) return sure.size === 1 ? [...sure.values()][0] : null;
        if (maybe.size) return maybe.size === 1 ? [...maybe.values()][0] : null;
      }
    } catch {
      // Nothing named.
    }
    return null;
  }

  const decoded = (s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };

  // The links in a container (the container itself when it is one), as addresses, with whether
  // each holds a <time> (a timestamp link: a post's own permalink).
  function linksIn(node, sel = "a[href]") {
    const found = [];
    const own = node.localName === "a" ? [node] : [];
    for (const a of [...own, ...(node.querySelectorAll ? node.querySelectorAll(sel) : [])]) {
      const u = linkTo(a.getAttribute && a.getAttribute("href"));
      if (u && /^https?:$/.test(u.protocol)) found.push({ u, time: Boolean(a.querySelector && a.querySelector("time")) });
    }
    return found;
  }

  // The page's site without its www. or mobile host (old.reddit.com is reddit.com).
  const siteName = (host) => host.replace(/^(www|m|mobile|web|touch|old|new|sh|music|geo|player)\./, "");

  // A video's own address on this page, by site; the page's own when it is that one video's page;
  // null when the page is a feed, a list or a search and nothing names the video.
  function ownAddress(v, url) {
    const site = SITES.find((s) => s.hosts.test(siteName(url.hostname)));
    if (site) {
      // A site's own player in another page (an embed) is its video's page: its address holds
      // what the links around it may lack (a private video's key).
      if (site.embed && site.embed(url)) return location.href;
      const found = nearest(v, (node) => site.read(node, url));
      if (found) return found;
      return site.own(url) ? location.href : null;
    }
    // Any other site: a player embedded in another page (its own frame), or the one video of its
    // page, is its video's own page, as before.
    if (framed() || (!inFeed(v) && document.querySelectorAll?.("video").length <= 1)) return location.href;
    // A page of many videos: the post around this one, when one names it; else the page in
    // general (an article with two players is still theirs to yt-dlp), but never a feed's
    // (role="feed") or a page whose address is a feed's, a home's or a search's.
    const found = nearest(v, (node) => genericRead(node, url));
    if (found) return found;
    return inFeed(v) || FEED_PATH.test(url.pathname) ? null : location.href;
  }

  // A feed's, a home page's, a search's address: many videos, none of them the page's.
  const FEED_PATH = /^\/(?:$|home\/?$|feed|explore|search|discover|trending|popular|latest|timeline|for-?you|following|watch\/?$)/i;
  // The video sits in a feed (role="feed": Mastodon's, the accessible feeds).
  function inFeed(v) {
    for (let node = upFrom(v); node; node = upFrom(node)) if (node.getAttribute?.("role") === "feed") return true;
    return false;
  }

  const framed = () => {
    try {
      return window.top !== window;
    } catch {
      return false;
    }
  };
  const manyVideos = (node) => Boolean(node.querySelectorAll && node.querySelectorAll("video").length > 1);

  // Any other site: a link of this site that has a post's or a video's shape, or that holds the
  // post's timestamp (Mastodon's, a forum's), and isn't the page itself.
  function genericRead(node, url) {
    const sure = new Map();
    const maybe = new Map();
    const here = `${url.origin}${url.pathname}${url.search}`;
    for (const { u, time } of linksIn(node)) {
      if (siteName(u.hostname) !== siteName(url.hostname)) continue;
      const address = `${u.origin}${u.pathname}${u.search}`;
      if (address === here) continue;
      if (time) sure.set(address, address);
      else if (/\/(?:status|statuses|videos?|watch|posts?|p|reels?|comments|clips?|v)(?:\/|\?|$)/i.test(u.pathname + (u.search ? "?" : ""))) maybe.set(address, address);
    }
    const permalink = linkTo(node.getAttribute?.("data-permalink"));
    if (permalink && siteName(permalink.hostname) === siteName(url.hostname)) sure.set(permalink.href, permalink.href);
    return { sure, maybe };
  }

  // LinkedIn's comment tools' key: base64url of a protobuf naming the post (field 1 its
  // activity, field 2 its ugcPost), whose one field is the id as a zigzag varint. [kind, id] or
  // null.
  function commentToolsUrn(key) {
    try {
      const bytes = [...atob(key.replace(/-/g, "+").replace(/_/g, "/"))].map((c) => c.charCodeAt(0));
      const kind = { 10: "activity", 18: "ugcPost" }[bytes[0]];
      if (!kind || bytes[1] !== bytes.length - 2 || bytes[2] !== 8) return null;
      let n = 0n;
      let shift = 0n;
      for (let i = 3; i < bytes.length; i += 1) {
        n |= BigInt(bytes[i] & 0x7f) << shift;
        shift += 7n;
        if (!(bytes[i] & 0x80)) {
          if (i !== bytes.length - 1 || n & 1n) return null;
          const id = String(n >> 1n);
          return /^\d{15,20}$/.test(id) ? [kind, id] : null;
        }
      }
    } catch {
      // Not such a key.
    }
    return null;
  }

  // The big sites with feeds: what names a post in their pages, the address yt-dlp reads it by
  // (its extractors' own address shapes), and their pages that are one video's own.
  const SITES = [
    {
      // A post's container carries its URN (data-urn, data-id); its links name it too. yt-dlp's
      // LinkedIn extractor reads /feed/update/urn:li:activity:<id>/ (and /posts/…); a post known
      // only by its ugcPost URN goes as /feed/update/urn:li:ugcPost:<id>/, the same public page,
      // where yt-dlp's generic reader finds the video.
      //
      // LinkedIn's feed since 2026 (its server-driven app: role="listitem" posts in a
      // data-testid="mainFeed" list) names a post nowhere near its video, only in the keys of
      // the post's parts (componentkey): its comments' URNs (urn:li:comment:(activity:<id>,…)),
      // its text's translation key (…userGeneratedContentId=<id>…, its ugcPost), and its comment
      // tools' key, <base64>-replaceableCommentTools, a protobuf of the post's URN (field 1 its
      // activity, field 2 its ugcPost, the id zigzag-encoded). Checked against a signed-in feed:
      // each decodes to the post its comments name, and each ugcPost's page plays the video.
      hosts: /^linkedin\.com$/,
      embed: (u) => /^\/embed\//.test(u.pathname),
      read(node) {
        const sure = new Map();
        const maybe = new Map();
        const post = (kind, id) =>
          (kind === "activity" ? sure : maybe).set(`${kind}:${id}`, `https://www.linkedin.com/feed/update/urn:li:${kind}:${id}/`);
        const add = (s) => {
          s = String(s || "");
          for (const m of s.matchAll(/urn:li:(?:comment:\()?(activity|ugcPost|share):(\d{6,})/g)) post(m[1], m[2]);
          for (const m of s.matchAll(/\b(userGeneratedContent|share|activity)Id=(\d{6,})/g)) post(m[1] === "userGeneratedContent" ? "ugcPost" : m[1], m[2]);
          // A post's public address: /posts/<who>_<words>-activity-<id>-<four>.
          const p = /\/posts\/[^/?#]*-(activity|ugcPost)-(\d{6,})-\w{4}/.exec(s);
          if (p) post(p[1], p[2]);
          const k = /^([\w-]{12,40})-replaceableCommentTools/.exec(s);
          const urn = k && commentToolsUrn(k[1]);
          if (urn) post(urn[0], urn[1]);
        };
        // The container's own attributes, whatever their names (the page renames them), and its
        // insides' known ones.
        for (const a of node.attributes || []) add(a.value);
        for (const el of node.querySelectorAll?.("[data-urn], [data-id], [data-activity-urn], [data-entity-urn], [componentkey]") || []) {
          for (const a of ["data-urn", "data-id", "data-activity-urn", "data-entity-urn", "componentkey"]) add(el.getAttribute?.(a));
        }
        for (const { u } of linksIn(node)) if (/linkedin\.com$/.test(u.hostname)) add(decoded(u.pathname));
        return { sure, maybe };
      },
      own: (u) => /^\/(?:feed\/update\/urn:li:|posts\/|embed\/feed\/update\/|events\/|learning\/)/.test(u.pathname),
    },
    {
      // A video's own links (a reel, a watch page, a page's video, data-video-id) before a post's
      // (its permalink); fb.watch short links as they are (they lead to the video's page).
      hosts: /^(?:[\w-]+\.)?facebook\.com$/,
      embed: (u) => /^\/plugins\/video\.php$/.test(u.pathname),
      read(node) {
        const sure = new Map();
        const maybe = new Map();
        const video = (id) => sure.set(`v:${id}`, `https://www.facebook.com/watch/?v=${id}`);
        const id = node.getAttribute?.("data-video-id");
        if (/^\d{6,}$/.test(id || "")) video(id);
        for (const el of node.querySelectorAll?.("[data-video-id]") || []) {
          const d = el.getAttribute("data-video-id");
          if (/^\d{6,}$/.test(d || "")) video(d);
        }
        for (const { u } of linksIn(node)) {
          if (u.hostname === "fb.watch") {
            const code = u.pathname.split("/")[1];
            if (/^\w+$/.test(code || "")) sure.set(`w:${code}`, `https://fb.watch/${code}/`);
            continue;
          }
          if (!/(^|\.)facebook\.com$/.test(u.hostname)) continue;
          const p = u.pathname;
          let m;
          if ((m = /^\/reel\/(\d+)/.exec(p))) sure.set(`v:${m[1]}`, `https://www.facebook.com/reel/${m[1]}/`);
          else if (/^\/watch\/?$/.test(p) && /^\d+$/.test(u.searchParams.get("v") || "")) video(u.searchParams.get("v"));
          else if (/^\/video\.php$/.test(p) && /^\d+$/.test(u.searchParams.get("v") || "")) video(u.searchParams.get("v"));
          else if ((m = /^\/[^/]+\/videos\/(?:[^/]+\/)?(\d+)/.exec(p))) video(m[1]);
          else if ((m = /^\/([^/]+)\/posts\/(pfbid\w+|\d+)/.exec(p))) maybe.set(`p:${m[2]}`, `https://www.facebook.com/${m[1]}/posts/${m[2]}`);
          else if ((m = /^\/groups\/([^/]+)\/(?:permalink|posts)\/(\d+)/.exec(p))) maybe.set(`p:${m[2]}`, `https://www.facebook.com/groups/${m[1]}/posts/${m[2]}/`);
          else if (/^\/(?:permalink|story)\.php$/.test(p) && /^(?:pfbid\w+|\d+)$/.test(u.searchParams.get("story_fbid") || "")) {
            const story = u.searchParams.get("story_fbid");
            const owner = u.searchParams.get("id");
            maybe.set(`p:${story}`, `https://www.facebook.com/permalink.php?story_fbid=${story}${/^\d+$/.test(owner || "") ? `&id=${owner}` : ""}`);
          }
        }
        return { sure, maybe };
      },
      own: (u) =>
        /^\/(?:reel\/\d|watch\/?$|video\.php$|[^/]+\/videos\/|[^/]+\/posts\/|permalink\.php$|story\.php$|groups\/[^/]+\/(?:permalink|posts)\/|plugins\/video\.php$|share\/[vrp]\/)/.test(u.pathname) &&
        (!/^\/watch\/?$/.test(u.pathname) || /^\d+$/.test(u.searchParams.get("v") || "")),
    },
    {
      // A post's timestamp links to it (/<user>/status/<id>); other status links (a quoted post,
      // its photos and its analytics) count only when there is no timestamp.
      hosts: /^(?:x|twitter)\.com$/,
      read(node) {
        const sure = new Map();
        const maybe = new Map();
        for (const { u, time } of linksIn(node, 'a[href*="/status/"]')) {
          const m = /^\/(\w{1,15}|i\/web)\/status\/(\d+)/.exec(u.pathname);
          if (!m || !/(^|\.)(?:x|twitter)\.com$/.test(u.hostname)) continue;
          (time ? sure : maybe).set(m[2], `${location.origin}/${m[1]}/status/${m[2]}`);
        }
        return { sure, maybe };
      },
      own: (u) => /^\/(?:\w{1,15}|i\/web)\/status\/\d+|^\/i\/(?:broadcasts|spaces)\//.test(u.pathname),
    },
    {
      // A post's links (/p/<code>/, a reel's /reel/<code>/): its timestamp, its comments.
      hosts: /^instagram\.com$/,
      embed: (u) => /\/embed\/?$/.test(u.pathname),
      read(node) {
        const sure = new Map();
        for (const { u } of linksIn(node)) {
          // Not a reel's sound (/reels/audio/<id>/, the other reels using it).
          const m = /^(?:\/[\w.]+)?\/(p|tv|reels?)\/(?!audio\/)([\w-]{5,})/.exec(u.pathname);
          if (!m || !/instagram\.com$/.test(u.hostname)) continue;
          sure.set(m[2], `https://www.instagram.com/${m[1] === "tv" ? "p" : m[1].replace(/s$/, "")}/${m[2]}/`);
        }
        return { sure, maybe: new Map() };
      },
      own: (u) => /^(?:\/[\w.]+)?\/(?:p|tv|reels?)\/[\w-]{5,}|^\/stories\/[^/]+\/\d/.test(u.pathname),
    },
    {
      // A post (shreddit-post, old Reddit's .thing) names its permalink in its attributes; its
      // links (title, comments) name the same /comments/<id>/.
      hosts: /^reddit\.com$/,
      read(node) {
        const sure = new Map();
        const add = (s) => {
          const m = /^(\/(?:r|u|user)\/[^/]+)?\/comments\/(\w+)/.exec(linkTo(s)?.pathname || "");
          if (m) sure.set(m[2], `${location.origin}${m[1] || ""}/comments/${m[2]}/`);
        };
        add(node.getAttribute?.("permalink"));
        add(node.getAttribute?.("data-permalink"));
        for (const el of node.querySelectorAll?.("[permalink], [data-permalink]") || []) {
          add(el.getAttribute("permalink"));
          add(el.getAttribute("data-permalink"));
        }
        for (const { u } of linksIn(node, 'a[href*="/comments/"]')) if (/reddit\.com$/.test(u.hostname)) add(u.href);
        return { sure, maybe: new Map() };
      },
      own: (u) => /\/comments\/\w+|^\/r\/[^/]+\/s\/\w+/.test(u.pathname),
    },
    {
      // A video's link (/@<user>/video/<id>); else its player's id (xgwrapper-<n>-<id>), sent in
      // yt-dlp's own form for a video whose author isn't known (/@_/video/<id>).
      hosts: /^tiktok\.com$/,
      embed: (u) => /^\/embed\//.test(u.pathname),
      read(node) {
        const sure = new Map();
        for (const { u } of linksIn(node, 'a[href*="/video/"]')) {
          const m = /^\/@([\w.-]+)\/video\/(\d+)/.exec(u.pathname);
          if (m && /tiktok\.com$/.test(u.hostname)) sure.set(m[2], `https://www.tiktok.com/@${m[1]}/video/${m[2]}`);
        }
        if (!sure.size) {
          for (const el of [node, ...(node.querySelectorAll?.('[id^="xgwrapper-"]') || [])]) {
            const m = /^xgwrapper-\d+-(\d{15,})$/.exec(el.getAttribute?.("id") || "");
            if (m) sure.set(m[1], `https://www.tiktok.com/@_/video/${m[1]}`);
          }
        }
        return { sure, maybe: new Map() };
      },
      own: (u) => /^\/@[\w.-]+\/(?:video|photo)\/\d+|^\/embed\//.test(u.pathname),
    },
    {
      // A clip's links: vimeo.com/<id> (with an unlisted video's hash), in a channel, a group, a
      // showcase.
      hosts: /^(?:player\.)?vimeo\.com$/,
      embed: (u) => u.hostname.startsWith("player."),
      read(node) {
        const sure = new Map();
        for (const { u } of linksIn(node)) {
          if (!/(^|\.)vimeo\.com$/.test(u.hostname)) continue;
          const m = /^(?:\/video|\/channels\/[^/]+|\/groups\/[^/]+\/videos|\/showcase\/[^/]+\/video)?\/(\d{4,})(\/[\da-f]{10})?\/?$/.exec(u.pathname);
          if (m) sure.set(m[1], `https://vimeo.com/${m[1]}${m[2] || ""}`);
        }
        return { sure, maybe: new Map() };
      },
      own: (u) =>
        u.hostname.startsWith("player.") ||
        /^(?:\/channels\/[^/]+|\/groups\/[^/]+\/videos|\/showcase\/[^/]+\/video|\/[^/]+\/review)?\/\d{4,}|^\/ondemand\//.test(u.pathname),
    },
    {
      hosts: /^(?:geo\.)?dailymotion\.com$/,
      embed: (u) => u.hostname.startsWith("geo.") || /^\/(?:embed|player)\b/.test(u.pathname),
      read(node) {
        const sure = new Map();
        for (const { u } of linksIn(node, 'a[href*="/video/"]')) {
          const m = /^\/(?:embed\/)?video\/([a-z0-9]+)/i.exec(u.pathname);
          if (m && /dailymotion\.com$/.test(u.hostname)) sure.set(m[1], `https://www.dailymotion.com/video/${m[1]}`);
        }
        return { sure, maybe: new Map() };
      },
      own: (u) => u.hostname.startsWith("geo.") || /^\/(?:embed\/)?video\/[a-z0-9]+|^\/player/i.test(u.pathname),
    },
  ];
  // ---- the video's own address: end.

  // The address this page first loaded at (`download`: a page that moves in place keeps its first
  // page's og:title).
  const landedAt = location.href;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // "Hide on this video": the video's address (players reuse one element for the next video),
  // else the element.
  const dismissed = new WeakSet();
  const dismissedSrc = new Set();
  const isDismissed = (v) => dismissed.has(v) || (v.currentSrc && dismissedSrc.has(v.currentSrc));
  // May it show here? The app's answer (Options: the button on, the site not listed), asked
  // again when older than ASK_MS, so a change in Options reaches a page already open (#532: one
  // that never reloads, as YouTube's, kept the button for good). `never`: this page's own
  // "Never on this site".
  let allowed = null;
  let askedAt = 0;
  let asking = null;
  let never = false;
  let placed = false;
  const ASK_MS = 5000;
  const answered = () => allowed !== null && Date.now() - askedAt < ASK_MS;
  let place = { x: 1, y: 0 }; // where on the edge: fractions of the room, top right by default
  let chosen = false; // the user put it where it is (dragged it, on this site): theirs, never moved for a page's control
  let auto = { v: null, at: null, t: 0 }; // the spot found for this video, kept for a moment
  const AUTO_MS = 400;
  // Where it is on the screen, while the pointer is on it (#560): { v, left, top }.
  let pinned = null;
  let video = null; // the video it is over
  // A video gone from under its button (#503): a hover-to-play preview (YouTube's thumbnails)
  // stops as soon as the pointer leaves it for the button, since the page sees the pointer go.
  // The button stays where it was, for that video, while the pointer is on it (or its menu is
  // open), or for HOLD_MS while the pointer is still over where the video was, on its way to it;
  // a click downloads what the video was playing.
  let held = null; // { r: the video's last rectangle, at: the button's spot, d: what download sends, since }
  const HOLD_MS = 1500;
  let lastRect = null; // the video's rectangle when the button was last placed over it
  let entered = null; // what download would send, taken as the pointer reached the button: { v, d, t }
  let lastMove = 0;
  let pointer = { x: -1, y: -1 };
  let menuOpen = false;
  let dragging = null;
  let busy = false;
  let flashing = false;
  let raf = 0;
  let scan = 0;
  // Kept on screen while the keyboard is on it (not after a mouse click: that leaves focus too),
  // or on the video's player (its own controls).
  const keyboardOn = () =>
    Boolean(shadow.activeElement && shadow.activeElement.matches(":focus-visible")) || playerFocused();
  let focusedPlayer = null;
  const playerFocused = () =>
    Boolean(video && focusedPlayer && document.activeElement === focusedPlayer &&
      focusedPlayer.contains(video) && focusedPlayer.matches(":focus-visible"));

  // ---- the button: a closed shadow tree the page's styles and scripts can't reach ----------
  const root = document.createElement("tdm-video-button");
  // Each with !important: a page's own rules can't hide or move it.
  for (const [k, v] of Object.entries({
    all: "initial", position: "fixed", "z-index": "2147483647", left: "0", top: "0", display: "none",
    contain: "layout style", opacity: "1", visibility: "visible", "pointer-events": "auto",
  })) root.style.setProperty(k, v, "important");
  const shadow = root.attachShadow({ mode: "closed" });
  const CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
/* A light, glossy panel that stands out over a dark video, with our icon: the classic download
   button's feel, made modern (rounded, crisp type, soft shadow and motion). */
.pill {
  display: flex; align-items: stretch; height: 34px; border-radius: 9px;
  background: linear-gradient(#ffffff, #f1f4f8 48%, #e3e8ef 52%, #eef2f6);
  color: #17324d; border: 1px solid rgba(23, 50, 77, .28);
  box-shadow: 0 4px 14px rgba(0, 0, 0, .32), 0 1px 0 rgba(255, 255, 255, .9) inset;
  font: 600 13px/1 "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
  opacity: 0; transform: translateY(-3px) scale(.98);
  transition: opacity .16s ease-out, transform .16s ease-out, filter .12s;
  user-select: none; -webkit-user-select: none; touch-action: none; white-space: nowrap;
}
.pill.shown { opacity: 1; transform: none; }
.pill.dragging { cursor: grabbing; box-shadow: 0 10px 28px rgba(0, 0, 0, .45); transition: none; }
.pill.dragging .go { cursor: grabbing; }
.pill.ok { background: linear-gradient(#f2fff6, #d4f3df); border-color: #2f9a5b; color: #135c33; }
.pill.err { background: linear-gradient(#fff4f4, #f6d6d6); border-color: #c24848; color: #7d1f1f; }
button {
  /* all: unset resets box-sizing too, past the rule above: without it a menu item's 100 % width
     plus its padding ran past the menu's edge (#81). */
  all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 8px;
  color: inherit; cursor: pointer; font: inherit;
}
.go { padding: 0 12px 0 8px; border-radius: 8px 0 0 8px; cursor: grab; }
.more { padding: 0 9px; border-left: 1px solid rgba(23, 50, 77, .18); border-radius: 0 8px 8px 0; }
.go:hover, .more:hover { background: linear-gradient(rgba(214, 232, 255, .9), rgba(182, 212, 250, .9)); }
.go:active, .more:active { background: rgba(160, 196, 242, .9); }
button:focus-visible { outline: 2px solid #2a78d6; outline-offset: -2px; }
.go img { width: 22px; height: 22px; flex: none; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .25)); }
.more svg { width: 12px; height: 12px; color: #3b5876; }
.compact .label { display: none; }
.compact .go { padding: 0 6px; border-radius: 8px 0 0 8px; }
.menu {
  position: absolute; min-width: 210px; padding: 4px; border-radius: 9px;
  background: #fbfcfe; color: #17324d; border: 1px solid rgba(23, 50, 77, .22);
  box-shadow: 0 12px 32px rgba(0, 0, 0, .35);
  font: 400 13px/1.2 "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
  display: none;
}
.menu.open { display: block; }
.menu button { display: block; width: 100%; padding: 8px 12px; border-radius: 6px; cursor: default; }
.menu button:hover, .menu button:focus-visible { background: #dceafb; outline: none; }
.menu hr { border: 0; border-top: 1px solid rgba(23, 50, 77, .12); margin: 4px 2px; }
@media (prefers-reduced-motion: reduce) { .pill { transition: none; transform: none; } }
`;
  // A constructed sheet: a page whose Content-Security-Policy refuses inline styles can't strip
  // it (Firefox applies the page's policy to what a content script adds).
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
    shadow.adoptedStyleSheets = [sheet];
  } catch {
    const style = document.createElement("style");
    style.textContent = CSS;
    shadow.appendChild(style);
  }
  shadow.innerHTML += `
<div class="pill" part="pill">
  <button class="go" type="button">
    <img alt="" draggable="false">
    <span class="label"></span>
  </button>
  <button class="more" type="button" aria-haspopup="menu" aria-expanded="false">
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5 6 7.5l3-3"/></svg>
  </button>
</div>
<div class="menu" role="menu">
  <button role="menuitem" data-act="download"></button>
  <hr>
  <button role="menuitem" data-act="hide"></button>
  <button role="menuitem" data-act="never"></button>
  <hr>
  <button role="menuitem" data-act="settings"></button>
</div>`;
  shadow.querySelector(".go img").src = LOGO;
  const pill = shadow.querySelector(".pill");
  const go = shadow.querySelector(".go");
  const label = shadow.querySelector(".label");
  const more = shadow.querySelector(".more");
  const menu = shadow.querySelector(".menu");
  const item = (act) => menu.querySelector(`[data-act="${act}"]`);
  pill.dir = ext.i18n.getMessage("@@bidi_dir") || "ltr";
  menu.dir = pill.dir;
  const idleLabel = t("video_download");
  label.textContent = idleLabel;
  go.title = `${idleLabel} — ${t("video_drag")}`;
  go.setAttribute("aria-label", idleLabel);
  more.title = t("video_more");
  more.setAttribute("aria-label", t("video_more"));
  item("download").textContent = idleLabel;
  item("hide").textContent = t("video_hide_here");
  item("never").textContent = ext.i18n.getMessage("video_never_site", [host]) || `Never on ${host}`;
  item("settings").textContent = t("video_settings");

  // ---- which video ----------------------------------------------------------------------------
  const videos = document.getElementsByTagName("video");
  const audios = document.getElementsByTagName("audio");

  // Videos inside open shadow roots (players built as web components), looked for again every
  // few seconds at most.
  let shadowed = [];
  let shadowedAt = 0;
  function shadowVideos() {
    if (Date.now() - shadowedAt < 3000) return shadowed;
    shadowedAt = Date.now();
    const found = [];
    const walk = (root, depth) => {
      if (depth > 4) return;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      for (let n = w.nextNode(), seen = 0; n && seen < 20000; n = w.nextNode(), seen++) {
        if (n.shadowRoot) {
          found.push(...n.shadowRoot.querySelectorAll("video"));
          walk(n.shadowRoot, depth + 1);
        }
      }
    };
    walk(document.documentElement, 0);
    shadowed = found;
    return found;
  }

  function eligible(v) {
    if (!v.isConnected || isDismissed(v)) return false;
    const r = v.getBoundingClientRect();
    const audio = v instanceof HTMLAudioElement;
    if (audio ? !v.controls || r.width < MIN_W || r.height < MIN_AUDIO_H : r.width < MIN_W || r.height < MIN_H) {
      return false;
    }
    // A short muted loop without controls: a moving picture, not something to save.
    if (v.muted && v.loop && !v.controls && !(v.duration > CLIP_S)) return false;
    const s = getComputedStyle(v);
    return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05;
  }

  // The topmost eligible video under (x, y): players lay their controls over the video, so the
  // video itself rarely gets the pointer's events.
  function videoAt(x, y) {
    let best = null;
    for (const v of [...videos, ...audios, ...shadowVideos()]) {
      const r = v.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom || !eligible(v)) continue;
      if (!best || r.width * r.height < best.r.width * best.r.height) best = { v, r };
    }
    return best && best.v;
  }

  // ---- placing it -------------------------------------------------------------------------
  // `place` is where it sits in the room the video leaves around it: x and y from 0 to 1, one of
  // them 0 or 1 (on an edge).
  function rects() {
    const r = held ? held.r : (lastRect = video.getBoundingClientRect());
    const w = pill.offsetWidth || 150;
    const h = pill.offsetHeight || 32;
    return { r, w, h, roomX: Math.max(0, r.width - w - 2 * INSET), roomY: Math.max(0, r.height - h - 2 * INSET) };
  }

  // Is a control of the page under this spot (a viewport rectangle)? What counts is something
  // on top of the video that the user clicks and that is much smaller than the video: a button,
  // a small link, a watch-later or menu button on a preview (#421); a link or layer over the
  // whole video isn't one. On the video itself, and below it, is nothing to cover.
  function onControl(b, video, videoRect) {
    const area = (x) => Math.max(0, x.width) * Math.max(0, x.height);
    const small = (el) => area(el.getBoundingClientRect()) < area(videoRect) / 5;
    const points = [
      [(b.left + b.right) / 2, (b.top + b.bottom) / 2],
      [b.left + 4, b.top + 4],
      [b.right - 4, b.top + 4],
      [b.left + 4, b.bottom - 4],
      [b.right - 4, b.bottom - 4],
    ];
    for (const [x, y] of points) {
      for (const el of document.elementsFromPoint(x, y)) {
        if (el === root) continue;
        if (el === video || el.contains(video)) break;
        const control = el.closest("button, [role=button], a[href], input, select, [onclick]");
        if (control && !control.contains(video) && small(control)) return true;
        if (small(el) && getComputedStyle(el).cursor === "pointer") return true;
      }
    }
    return false;
  }

  // Where it goes now: the place the user gave it, else the default corner, or the next corner
  // free of the page's own controls (a thumbnail's watch-later button at the top right, #421).
  // Over the same video it only ever goes on to the next corner, never back to one it left: a
  // hover-to-play preview (YouTube's thumbnails, #560) shows its sound and captions buttons while
  // the pointer is over the video and hides them as the pointer reaches the button, so going back
  // when they hide, then away again when they show, kept the button jumping from under the pointer.
  const CORNERS = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
  function spot(r, w, h, roomX, roomY) {
    if (chosen) return place;
    const now = Date.now();
    const same = auto.v === video;
    if (same && now - auto.t < AUTO_MS) return auto.at;
    const order = [place, ...CORNERS];
    const from = same ? Math.max(0, order.indexOf(auto.at)) : 0;
    let at = same ? auto.at : place;
    for (const c of order.slice(from)) {
      const left = r.left + INSET + c.x * roomX;
      const top = r.top + INSET + c.y * roomY;
      if (!onControl({ left, top, right: left + w, bottom: top + h }, video, r)) {
        at = c;
        break;
      }
    }
    auto = { v: video, at, t: now };
    return at;
  }

  function position() {
    if (!video) return;
    const { r, w, roomX, roomY } = rects();
    // The pointer on it (or its menu open): it stays where it is, whatever the video does
    // meanwhile. A preview that grows while the pointer is over it and shrinks back when the
    // pointer goes (#560) would otherwise take the button from under the pointer.
    if (!dragging && pinned && pinned.v === video && (menuOpen || root.matches(":hover"))) {
      if (menuOpen) placeMenu(pinned.top, pinned.left, w);
      return;
    }
    // A narrow video gets the icon only.
    pill.classList.toggle("compact", r.width < 360);
    // Held for a video gone (#503): where it was, not a corner found anew over what the page
    // shows there now.
    const at = dragging ? dragging.at : held && !chosen ? held.at : spot(r, w, pill.offsetHeight || 32, roomX, roomY);
    const left = r.left + INSET + at.x * roomX;
    // In the part of the video on screen: one scrolled half out keeps its button in view.
    const h = pill.offsetHeight || 32;
    const visTop = Math.max(r.top, 0) + INSET;
    const visBottom = Math.min(r.bottom, innerHeight) - INSET - h;
    const top = Math.min(Math.max(r.top + INSET + at.y * roomY, visTop), Math.max(visTop, visBottom));
    root.style.setProperty("transform", `translate(${Math.round(left)}px, ${Math.round(top)}px)`, "important");
    pinned = { v: video, left, top };
    if (menuOpen) placeMenu(top, left, w);
  }

  // The menu opens below the button, or above it near the bottom of the window; aligned with
  // whichever of its sides is nearer the video's middle.
  function placeMenu(top, left, w) {
    const h = menu.offsetHeight;
    const below = top + 36 + h < innerHeight;
    menu.style.top = below ? "36px" : `${-h - 4}px`;
    const { r } = rects();
    const rightHalf = left + w / 2 > r.left + r.width / 2;
    menu.style.left = rightHalf ? "" : "0";
    menu.style.right = rightHalf ? "0" : "";
  }

  // Snap a free spot (fractions, after a drag) to the nearest edge.
  function snap(at) {
    const d = { left: at.x, right: 1 - at.x, top: at.y, bottom: 1 - at.y };
    const edge = Object.keys(d).reduce((a, b) => (d[a] <= d[b] ? a : b));
    // Along the edge it stays where it was dropped, but close to a corner it goes into it.
    const c = (n) => (n < 0.08 ? 0 : n > 0.92 ? 1 : n);
    if (edge === "left") return { x: 0, y: c(at.y) };
    if (edge === "right") return { x: 1, y: c(at.y) };
    if (edge === "top") return { x: c(at.x), y: 0 };
    return { x: c(at.x), y: 1 };
  }

  // ---- showing and hiding ---------------------------------------------------------------------
  function attach() {
    // Over the video in fullscreen: inside the fullscreen element (a fullscreen <video> itself
    // can't hold it: then it hides).
    const fs = document.fullscreenElement;
    const parent = fs && fs !== video && fs.contains(video) ? fs : document.documentElement;
    if (root.parentNode !== parent) parent.appendChild(root);
    return !(fs && (fs === video || !fs.contains(video)));
  }

  function show(v) {
    if (video !== v) {
      video = v;
      held = null;
      closeMenu();
    }
    if (!attach()) return hide(true);
    root.style.setProperty("display", "block", "important");
    position();
    if (!pill.classList.contains("shown")) requestAnimationFrame(() => pill.classList.add("shown"));
    if (!raf) raf = requestAnimationFrame(tick);
  }

  // `now`: at once and whatever has the focus (dismissed, the video gone).
  function hide(now) {
    if (!now && (menuOpen || dragging || keyboardOn())) return;
    pinned = null;
    if (now) {
      held = null;
      closeMenu();
      shadow.activeElement?.blur();
    }
    pill.classList.remove("shown");
    cancelAnimationFrame(raf);
    raf = 0;
    const was = video;
    setTimeout(() => {
      if (!pill.classList.contains("shown") && video === was) root.style.setProperty("display", "none", "important");
    }, now || reduced ? 0 : 180);
  }

  // What the button sends for `v` (its rectangle `r`): see `download`.
  function describe(v, r) {
    const url = videoPage(v);
    // Its own plain file (not a stream the page assembles, blob:). Not beside a post a big site's
    // reader knows (#689): the app would take the file over the post, its title and qualities.
    const file = /^https?:/i.test(v.currentSrc || "") ? v.currentSrc : "";
    const post = Boolean(url) && url !== location.href && SITES.some((s) => s.hosts.test(siteName(host)));
    return {
      drm: Boolean(v.mediaKeys),
      src: post ? "" : file,
      url,
      // The middle of the video: where the background asks the page's own player what it plays.
      at: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
    };
  }

  // The video just went from under the button (#503): what it was, kept. What was taken as the
  // pointer reached the button, when that was a moment ago; else the video as it is now.
  function hold() {
    const now = Date.now();
    const d = entered && entered.v === video && now - entered.t < 1000 ? entered.d : describe(video, lastRect);
    return { r: lastRect, at: chosen ? place : (auto.v === video && auto.at) || place, d, since: now };
  }

  // While shown: follow the video (scrolling, layout) and fade when the pointer rests.
  function tick() {
    raf = 0;
    if (!video) return hide(true);
    const onButton = root.matches(":hover");
    if (!video.isConnected || !eligible(video)) {
      if (!held && lastRect && !isDismissed(video)) held = hold();
      const r = held && held.r;
      const over =
        r && pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
      if (!held || !(onButton || menuOpen || dragging || keyboardOn() || (over && Date.now() - held.since < HOLD_MS))) {
        const was = held;
        held = null;
        video = null;
        // Left after it was held: it fades, as when the pointer leaves a video.
        return was ? hide() : hide(true);
      }
      position();
      raf = requestAnimationFrame(tick);
      return;
    }
    held = null;
    const r = video.getBoundingClientRect();
    const over =
      pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
    if (!onButton && !menuOpen && !dragging && !keyboardOn() && (!over || Date.now() - lastMove > IDLE_MS)) {
      return hide();
    }
    position();
    raf = requestAnimationFrame(tick);
  }

  // At most one look per frame, however fast the pointer moves.
  function onMove(e) {
    pointer = { x: e.clientX, y: e.clientY };
    lastMove = Date.now();
    if (!scan) scan = requestAnimationFrame(look);
  }

  function look() {
    scan = 0;
    if (dragging || never || (allowed === false && answered())) return;
    const v = videoAt(pointer.x, pointer.y);
    if (!v) return;
    if (!answered()) return void ask().then(() => allowed && look());
    show(v);
  }

  // One question at a time; while it is out, the button waits for its answer.
  function ask() {
    if (never) {
      allowed = false;
      return Promise.resolve();
    }
    if (answered()) return Promise.resolve();
    asking = asking || send({ type: "panel" }).then(async (r) => {
      allowed = !never && Boolean(r && r.on);
      askedAt = Date.now();
      // Switched off meanwhile: gone now, unless the menu or a drag has it in hand.
      if (!allowed && video && !menuOpen && !dragging) {
        video = null;
        hide(true);
      }
      if (allowed && !placed) {
        placed = true;
        try {
          const { positions } = await ext.storage.local.get({ positions: {} });
          if (positions[host]) {
            place = snap(positions[host]);
            chosen = true;
          }
        } catch {
          // Default spot.
        }
      }
    }).finally(() => (asking = null));
    return asking;
  }

  // ---- acting ---------------------------------------------------------------------------------
  async function download() {
    if (busy || !video) return;
    busy = true;
    try {
      closeMenu();
      // Asked now, not kept: one <video> plays many videos at the same address (a feed's
      // previews). A video gone from under the button: what it played then (#503).
      const { drm, src, url, at } = held ? held.d : describe(video, video.getBoundingClientRect());
      // Encrypted (DRM): no tool can save it; say so rather than send it.
      if (drm) return flash("err", t("video_drm"));
      // A page that moved in place keeps its first page's og:title; its document title follows.
      const og = location.href === landedAt ? document.querySelector('meta[property="og:title"]')?.content : "";
      const title = (og || document.title || "").trim();
      const r = await send({ type: "video", src, title, url, at });
      if (r.gone) return;
      const why = { options: "video_off", unnamed: "video_unnamed", feed: "video_open_post" }[r.why];
      flash(r.ok ? "ok" : "err", t(r.ok ? "video_sent" : why || "video_failed"));
    } finally {
      busy = false;
    }
  }

  // A short confirmation on the button itself, then back to normal.
  function flash(kind, text) {
    flashing = true;
    pill.classList.remove("ok", "err");
    pill.classList.add(kind);
    label.textContent = text;
    lastMove = Date.now();
    position();
    setTimeout(() => {
      flashing = false;
      pill.classList.remove(kind);
      label.textContent = idleLabel;
      if (video) position();
    }, 2200);
  }

  function openMenu() {
    menuOpen = true;
    menu.classList.add("open");
    more.setAttribute("aria-expanded", "true");
    position();
    menu.querySelector("button").focus();
  }

  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove("open");
    more.setAttribute("aria-expanded", "false");
  }

  menu.addEventListener("click", (e) => {
    if (!e.isTrusted) return;
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act) run(act);
  });

  async function run(act) {
    if (act === "download") return download();
    closeMenu();
    if (act === "hide") {
      held = null;
      dismissed.add(video);
      if (video.currentSrc) dismissedSrc.add(video.currentSrc);
      video = null;
      return hide(true);
    }
    if (act === "never") {
      never = true;
      allowed = false;
      video = null;
      hide(true);
      return send({ type: "hide-site" });
    }
    if (act === "settings") send({ type: "options" });
  }

  more.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));

  // The pointer reached the button: what the video plays now, kept in case the page stops it for
  // that (a hover-to-play preview, #503).
  root.addEventListener("pointerenter", () => {
    if (video && !held && video.isConnected && eligible(video)) {
      entered = { v: video, d: describe(video, video.getBoundingClientRect()), t: Date.now() };
    }
  });

  // Keys: Escape closes the menu, arrows move through it.
  shadow.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) {
      closeMenu();
      more.focus();
      e.stopPropagation();
    } else if (menuOpen && (e.key === "Enter" || e.key === " ") && menu.contains(shadow.activeElement)) {
      // The focused command, whatever the browser does with a key on a button.
      run(shadow.activeElement.dataset.act);
      e.preventDefault();
    } else if (menuOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      const items = [...menu.querySelectorAll("button")];
      const i = items.indexOf(shadow.activeElement);
      items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus();
      e.preventDefault();
    }
  });

  // The main part: a click downloads, a drag moves it (and is not a click).
  // Only the user's own clicks and keys (never events a page script makes up).
  go.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !video || !e.isTrusted) return;
    const { r, roomX, roomY } = rects();
    dragging = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      // Where in the button it was taken.
      dx: e.clientX - (r.left + INSET + (chosen ? place : auto.at || place).x * roomX),
      dy: e.clientY - (r.top + INSET + (chosen ? place : auto.at || place).y * roomY),
      at: chosen ? place : auto.at || place,
      moved: false,
    };
    go.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  go.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== dragging.id) return;
    if (!dragging.moved && Math.hypot(e.clientX - dragging.startX, e.clientY - dragging.startY) < DRAG_PX) return;
    if (!dragging.moved) {
      dragging.moved = true;
      closeMenu();
      pill.classList.add("dragging");
    }
    const { r, roomX, roomY } = rects();
    const c = (n) => Math.min(1, Math.max(0, n));
    dragging.at = {
      x: roomX ? c((e.clientX - dragging.dx - r.left - INSET) / roomX) : 0,
      y: roomY ? c((e.clientY - dragging.dy - r.top - INSET) / roomY) : 0,
    };
    position();
  });
  const endDrag = (e) => {
    if (!dragging || e.pointerId !== dragging.id) return;
    const d = dragging;
    dragging = null;
    pill.classList.remove("dragging");
    if (!d.moved) {
      if (e.type === "pointerup") download();
      return;
    }
    place = snap(d.at);
    chosen = true;
    // It snaps to its corner although the pointer is still on it (#560's pin is for a video
    // that changes under a still pointer, not for the user's own move).
    pinned = null;
    position();
    lastMove = Date.now();
    // Remembered per site, not in a private window (it would keep the site's name), and the
    // 200 sites used last only.
    if (ext.extension?.inIncognitoContext) return;
    try {
      ext.storage.local
        .get({ positions: {} })
        .then(({ positions }) => {
          delete positions[host];
          positions[host] = place;
          const sites = Object.keys(positions);
          for (const s of sites.slice(0, Math.max(0, sites.length - 200))) delete positions[s];
          return ext.storage.local.set({ positions });
        })
        .catch(() => {});
    } catch {
      teardown();
    }
  };
  go.addEventListener("pointerup", endDrag);
  go.addEventListener("pointercancel", endDrag);
  // Keyboard: Enter / Space (a real button's click without a pointer).
  go.addEventListener("click", (e) => {
    if (e.detail === 0 && e.isTrusted) download();
  });

  // ---- wiring -----------------------------------------------------------------------------------
  // The extension updated or removed under this page: the button and its listeners go (a fresh
  // copy of this script comes with the new extension).
  function teardown() {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(scan);
    removeEventListener("pointermove", onMove, true);
    removeEventListener("keydown", onTab, true);
    root.remove();
    never = true;
    allowed = false;
    video = null;
  }
  globalThis.__mdmVideoButton = { alive: () => Boolean(ext.runtime?.id), teardown };
  addEventListener("pointermove", onMove, { capture: true, passive: true });
  addEventListener("pointerdown", (e) => {
    if (menuOpen && !e.composedPath().includes(root)) closeMenu();
  }, { capture: true, passive: true });
  // A video with the keyboard's focus, or a player around one (its controls), gets the button
  // too, kept while the focus stays there; Tab goes from there to the button.
  addEventListener("focusin", (e) => {
    if (!(e.target instanceof Element) || e.composedPath().includes(root)) return;
    const t = e.target;
    const v =
      t instanceof HTMLMediaElement ? t : [...t.querySelectorAll("video, audio")].find(eligible) || null;
    if (!v || !eligible(v)) return;
    focusedPlayer = t;
    ask().then(() => {
      if (!allowed) return;
      lastMove = Date.now();
      show(v);
    });
  }, true);
  // Tab on the focused player moves into the button first; Tab from the button goes back to
  // the player and on from there (its own controls next), as if the button sat at its start.
  let tabOn = 0;
  function onTab(e) {
    if (e.key !== "Tab" || e.shiftKey) return;
    // The Tab that just left the button: on from the player, as the browser goes.
    if (Date.now() - tabOn < 100) {
      tabOn = 0;
      return;
    }
    if (video && playerFocused() && root.style.getPropertyValue("display") === "block") {
      go.focus();
      e.preventDefault();
    }
  }
  addEventListener("keydown", onTab, true);
  go.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !e.shiftKey && focusedPlayer && focusedPlayer.isConnected) {
      tabOn = Date.now();
      focusedPlayer.focus();
    }
  });
  document.addEventListener("fullscreenchange", () => video && show(video));
  addEventListener("blur", () => hide());
})();
