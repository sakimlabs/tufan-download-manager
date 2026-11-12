# Tufan Download Manager on a server, without a window (#157): docs/server.md.
#
#   docker build -t tufan-download-manager .
#   docker run -d --name mdm -p 8463:8463 -v tdm-config:/config -v /srv/downloads:/downloads \
#     tufan-download-manager
#   docker logs mdm                                  # the address and a pairing code
#   docker exec mdm tufan-download-manager-cli pair   # another code
#
# PROFILE=release (the default) is what ships: slow to build (whole-program optimisation);
# `--build-arg PROFILE=dev` builds quicker, for a try.
ARG PROFILE=release

FROM rust:1-trixie AS build
ARG PROFILE
# The program links only the C library: the window's libraries (X11, Wayland, OpenGL, EGL,
# xkbcommon) are loaded when a window opens, and the server opens none. So no GTK or GL here or
# in the image; cmake for the TLS library (aws-lc).
RUN apt-get update \
 && apt-get install -y --no-install-recommends cmake \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY . .
# No debug info: the programs are stripped (the release's symbols come from CI's builds). The
# build folder (gigabytes) is removed in the same step, so no layer keeps it; no BuildKit cache
# mounts either, so the classic builder (Ubuntu's docker.io, some NAS systems) builds it too.
ENV CARGO_PROFILE_RELEASE_DEBUG=false
RUN set -e; \
    cargo build --locked --profile "$PROFILE" -p tdm-app -p tdm-cli; \
    out="target/$PROFILE"; if [ "$PROFILE" = dev ]; then out=target/debug; fi; \
    mkdir -p /out; cp "$out/tufan-download-manager" "$out/tufan-download-manager-cli" /out/; \
    strip /out/*; \
    rm -rf target /usr/local/cargo/registry /usr/local/cargo/git

FROM debian:trixie-slim
# The certificates downloads are checked against; nothing else (above).
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p /config /downloads && chown 1000:1000 /config /downloads
COPY --from=build /out/ /usr/local/bin/
# The list, settings, certificate and paired devices in /config; the files in /downloads.
ENV TDM_DATA_DIR=/config TDM_DOWNLOADS=/downloads
VOLUME ["/config", "/downloads"]
# The remote control (HTTPS); torrents use a port of their own (Torrent settings).
EXPOSE 8463
# Any user works (`--user 99:100` on Unraid): it needs only to write /config and /downloads.
USER 1000:1000
# TDM handles docker stop's SIGTERM itself (it saves the list), so it runs as PID 1.
ENTRYPOINT ["tufan-download-manager", "--headless"]
