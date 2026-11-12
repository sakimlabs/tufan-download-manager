# Run TDM on a server

Run Tufan Download Manager on a home server or a NAS (Docker, Unraid, any Linux machine) without
a window, and send it downloads from your phone or your browser: the server downloads them into
its own folders, such as a network share.

It is the same TDM as on a desktop: its list, categories, queues, Scheduler, speed limits and
torrents. You control it with the [remote control's page](remote-control.md) (from any phone or
computer on your network), the browser extension pointed at it, or its command line.

> **New:** the server mode is new in this version. Please
> [tell us how it goes](https://github.com/sakimlabs/tufan-download-manager/issues).

## With Docker

Build the image from TDM's source (a published image comes later):

```sh
git clone https://github.com/sakimlabs/tufan-download-manager
cd tufan-download-manager
docker build -t tufan-download-manager .
```

The first build is long (up to an hour on a small server: the whole program is optimised as
one). The image is small, about 175 MB: Debian's slim base, TDM's two programs and the
certificates downloads are checked against. It needs no desktop libraries: TDM loads those only
to open a window, which a server never does.

Then run it, with a folder for its settings and one for the downloads. Make both folders first,
as the user TDM will run as: a folder Docker makes for you belongs to `root`, and TDM can't use it.

```sh
mkdir -p /srv/tdm-config /srv/downloads
docker run -d --name mdm --restart unless-stopped \
  -p 8463:8463 \
  -v /srv/tdm-config:/config \
  -v /srv/downloads:/downloads \
  --user "$(id -u):$(id -g)" \
  tufan-download-manager
```

- `/config` keeps the list, the settings, the certificate and the paired devices.
- `/downloads` is where files land: each category has its folder inside (`Music`, `Video`,
  `Torrents`…). Mount a network share there to download straight onto it.
- `--user`: the user that owns those folders (TDM runs as no particular user).

[docker/compose.yml](../docker/compose.yml) does the same with Docker Compose.

## Pair your phone

`docker logs mdm` shows the address to open and, while no device is paired, a pairing code with a
QR code:

```text
The remote control listens at: https://172.17.0.2:8463/
Its certificate's SHA-256 fingerprint: DE:26:7F:…
No device is paired yet. Open the address (or scan this) and enter the code 1037 1606 …
```

Inside a container, the address TDM finds is the container's own: give it the one you open, the
**server's** address with the port you published, as `-e TDM_REMOTE_URL=https://192.168.1.10:8463/`,
and the log and the QR code show that one. Then pair as
[Control TDM from your phone](remote-control.md#pair-your-phone) says. For another code, at any
time:

```sh
docker exec mdm tufan-download-manager-cli pair
```

To open the page by the server's name (`https://nas.local:8463/`), give TDM that name:
`-e TDM_REMOTE_HOSTS=nas.local` (several: separated by commas). Other names are refused, so that
no web page can reach TDM through a name of its own.

## On Unraid

[docker/unraid.xml](../docker/unraid.xml) is a template: copy it to
`/boot/config/plugins/dockerMan/templates-user/` on the flash drive, then **Docker → Add
Container** and pick **tufan-download-manager**. It maps `/config` to `appdata`, `/downloads` to a
share, the port 8463, and runs as `nobody:users` (99:100), as Unraid's shares expect. The image
must be built first (above), on the server or pushed to a registry you use. If the container's
log says a folder belongs to another user, give it to `nobody:users` once:
`chown -R 99:100 /mnt/user/appdata/tufan-download-manager`.

## Without Docker

On any Linux machine with TDM installed (the `.deb`, `.rpm`, AppImage or `tar.gz`):

```sh
tufan-download-manager --headless --data ~/tdm-server --downloads /srv/downloads
```

| Flag | Or the variable | What it sets |
|---|---|---|
| `--data <folder>` | `TDM_DATA_DIR` | the list, settings, certificate and paired devices |
| `--downloads <folder>` | `TDM_DOWNLOADS` | where downloads go (each category's folder inside) |
| `--port <number>` | `TDM_REMOTE_PORT` | the remote control's port (8463) |
| `--listen <address>` | `TDM_REMOTE_LISTEN` | where it listens: every local network address unless given |
| `--hosts <names>` | `TDM_REMOTE_HOSTS` | names besides its addresses the page may be opened by |
| | `TDM_REMOTE_URL` | the page's address as you open it, shown with the pairing code |

The remote control is on in this mode (`TDM_REMOTE=off` turns it off). It stops cleanly, saving
its list, when the system stops it (`docker stop`, systemd, Ctrl+C). It works on Windows and
macOS too, the same way.

The command line talks to it as to a desktop TDM, with the same data folder:
`TDM_DATA_DIR=~/tdm-server tufan-download-manager-cli status` (once `api on`), `pair`, and adding
an address: `tufan-download-manager /d https://example.com/file.zip`.

## Send downloads from your browser

In the browser extension's menu, **Send downloads to → Another Tufan Download Manager (a server)**: type the server's address,
open it once in that browser to accept its certificate, then enter a pairing code (`pair`
above). Downloads the extension catches, and **Download with Tufan Download Manager** on a link,
then go to the server instead of this computer. The browser's cookies are not sent to the server:
a download that needs you to be signed in to a site stays with this computer.

## What a server doesn't do

- Video pages (yt-dlp) and image galleries need their helpers, which the image doesn't include.
- Nothing opens a window: a download that would ask a question (a duplicate, files already
  there) takes the choice set in the settings, or isn't added.
- Don't publish the port on the internet; reach your home network through a VPN instead.
