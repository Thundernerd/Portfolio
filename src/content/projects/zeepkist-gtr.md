---
title: Zeepkist GTR
repo: donderjoekel/Zeepkist.GTR
kind: featured
tags: [C#, .NET, PostgreSQL, GraphQL, Docker, Discord]
blurb: A record-tracking system for Zeepkist, from the in-game mod to the backend, database, GraphQL API and Discord bot.
stars: 1
---

<!-- TODO(Christiaan): say what "GTR" stands for, add screenshots (`image` in the frontmatter) and any player or record numbers you want shown. -->
<!-- TODO(Christiaan): decide whether the private repos (JSON API, record processors, auth, stream) may be named here; they are left out until then. -->

Zeepkist GTR is a whole system rather than a single mod. Players race with the in-game mod, which sends
their records to a backend, and the results come back to the game, to a GraphQL API and to Discord. The
services run as Docker containers next to a PostgreSQL database.

- **[Mod](https://github.com/donderjoekel/Zeepkist.GTR.Mod)**: the BepInEx mod for Zeepkist. It submits
  records, shows leaderboards and ghosts of other players' runs, and has a level browser and chat commands
  for world records, favourites and votes.
- **[Backend](https://github.com/donderjoekel/Zeepkist.GTR.Backend)**: the .NET service that handles
  authentication, records, favourites and votes, and runs background jobs with Hangfire.
- **[Database](https://github.com/donderjoekel/Zeepkist.GTR.Database)**: the Entity Framework Core model of the
  PostgreSQL database: users, levels, records, personal bests, world records and points.
- **[GraphQL](https://github.com/donderjoekel/Zeepkist.GTR.Graphql)**: the database is served as a GraphQL
  API through PostGraphile; this repo generates the typed client the mod queries it with.
- **[Discord](https://github.com/donderjoekel/Zeepkist.GTR.Discord)**: a bot that receives new records over a
  WebSocket and posts them to Discord.

The [main repo](https://github.com/donderjoekel/Zeepkist.GTR) explains how to host your own instance with
Docker Compose.
