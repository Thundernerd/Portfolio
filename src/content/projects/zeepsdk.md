---
title: ZeepSDK
repo: donderjoekel/ZeepSDK
kind: featured
tags: [C#, Unity, BepInEx, Harmony]
blurb: A community-built modding SDK for Zeepkist that other mods build on, with high-level APIs over the game's internals.
stars: 1
---

<!-- TODO(Christiaan): add a screenshot (`image` in the frontmatter), say what you built, and name mods that use ZeepSDK. -->

ZeepSDK is a software development kit for Zeepkist mods, built on [BepInEx](https://github.com/BepInEx/BepInEx)
and using Harmony for runtime patching. Mods call its APIs instead of the game's internals, so a game update
can be fixed once in the SDK rather than in every mod.

Its APIs cover:

- **Core:** chat and chat commands, in-game messages, storage, settings, UI and input controls.
- **Gameplay:** racing events, levels, multiplayer lobbies, leaderboards and playlists.
- **Editor:** the level editor and photo mode.
- **Advanced:** Lua scripting (ZUA), communication between mods, the Steam Workshop, cosmetics and opt-in crash
  reporting.

The [API documentation](https://donderjoekel.github.io/ZeepSDK/api/index.html) is published from the repo, and
the SDK ships as a NuGet package.
