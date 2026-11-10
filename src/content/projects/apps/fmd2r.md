---
title: FMD2r
repo: Thundernerd/FMD2r
kind: app
tags: [Rust, Svelte, TypeScript, Lua]
blurb: A self-hosted Rust port of the manga downloader FMD2, with a Svelte web UI.
stars: 0
---

<!-- TODO(Christiaan): add a screenshot (`image` in the frontmatter) and say what you built and why. -->

FMD2r rewrites FMD2 as a self-hosted Rust backend (SQLite) with a mobile-friendly Svelte web UI. It
runs FMD2's community-maintained Lua website modules unchanged and pulls their updates from upstream.

- Gets past Cloudflare and DDoS-Guard challenges with FMD2's own bypass scripts, using
  [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr) for Cloudflare.
- Matches list titles offline against a local copy of the [MangaBaka](https://mangabaka.org)
  database, for format and publication facets and series descriptions.
- Lets you restyle the web UI with a `custom.css` that overrides its design tokens.
