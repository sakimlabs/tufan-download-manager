---
name: Browser extension
title: Browser extension that sends downloads to a download manager
headline: Click a download. TDM takes it from there.
line: Downloads you click in Chrome, Edge, Brave, Opera, Vivaldi or Firefox go straight to TDM, sign-in included.
lede: The free TDM extension hands each download you click over to TDM, with the page it came from and your sign-in for the site. A button over videos sends them to TDM too.
description: The Tufan Download Manager extension for Chrome, Edge, Brave, Opera, Vivaldi and Firefox: downloads you click go to TDM with their cookies.
group: downloading
order: 20
since: 0.1.0
shot: images/help/catch-file-info.webp
shot_alt: Download File Info in TDM for a file clicked in the browser
where: Options → General → Use advanced browser integration
help: browser-integration.md
---

## The browser's downloads, in TDM

Click a download link and **Download File Info** opens in TDM instead of the browser's own
download bar. TDM gets the address together with the page it came from, your cookies for the
site and the browser's User-Agent, so a download that needs you to be signed in still works.
The browser's copy is cancelled and taken off its download list.

You decide what TDM takes. **Options → File types** lists the file types it catches (ZIP, RAR,
EXE, ISO, MP4, PDF and many more) and the sites it leaves alone, and **Options → General** has
the browsers it takes downloads from. Everything else stays with the browser.

TDM doesn't need to be running first: the browser starts it. If TDM can't be reached at all, the
download stays with the browser, so nothing is lost.

## Right-click, or the button over a video

Right-click a link, a picture, a video or a sound and choose **Download with Mister Download
Manager**: TDM downloads it whatever its type.

![The Download video button over a YouTube video in Chrome](images/help/video-button.webp)
*The button over a video. Drag it along the edge; it stays where you put it.*

Point at a video and a small **Download video** button appears at its edge. It opens TDM's
**Download video from a page** window with the qualities on offer (see
[video downloads](/features/video.html)). You can hide it on one video or one site, or turn it
off in **Options**.

## Installed from the store, kept up to date

Install TDM with its setup and keep **Set up browser integration** ticked. Then add the
extension: Firefox 140 or later takes it from addons.mozilla.org, and Chrome, Edge, Brave, Opera
and Vivaldi from the Chrome Web Store. The browser keeps it updated.

Some limits, plainly: the portable copy can't connect to a browser, since it writes nothing
outside its folder.

## More of the browser, in version 0.5.0

<!--@coming 0.5-->

- **The toolbar button** says whether the browser reaches TDM, and **How to fix it** opens the
  help for the reason. When a setting leaves a download to the browser (its type isn't in
  **File types**, its site is excluded, it's under the minimum size), the button names the
  setting and the file, and TDM's log keeps a line for each.
- **Media on this page** lists the video streams and the video and sound files a page has
  loaded, so a video with no link can still be saved. Copy-protected streams are listed as
  **Protected** and never sent.
- **Download all links** and **Download selected links** send a page's links to
  [Link grabber](/features/link-grabber.html).
- PDFs, music and videos the browser would open itself, and downloads from forms, go to TDM
  too. Hold **Alt** while clicking to let the browser have one.
- Browsers built on Firefox or Chromium, such as Zen, LibreWolf, Floorp, Waterfox and Helium,
  reach TDM. Flatpak browsers on Linux can't start TDM's helper.
- **Test browser integration...** in **Options → General** checks TDM's side.
