---
title: Zeepkist GTR
repo: donderjoekel/Zeepkist.GTR
kind: zeepkist-mod
tags: [C#, .NET, PostgreSQL, GraphQL, RabbitMQ, Docker, Discord]
blurb: A records and leaderboards system for Zeepkist, from the in-game mod to the backend services, database, GraphQL API and Discord bot.
stars: 1
---

<!-- TODO(Christiaan): say what "GTR" stands for, add screenshots (`image` in the frontmatter) and any player or record numbers you want shown. -->
<!-- TODO(Christiaan): confirm the split services still run as Docker containers (the intro and the `Docker` tag say so; the only Compose setup is the retired backend's). -->

Zeepkist GTR is a whole system rather than a single mod. Players race with the in-game mod, which sends
their records to a set of .NET services that pass them along over a RabbitMQ message bus, and the results
come back to the game, to a GraphQL API and to Discord. The services run as Docker containers next to a
PostgreSQL database.

- **[Mod](https://github.com/donderjoekel/Zeepkist.GTR.Mod)**: the BepInEx mod for Zeepkist. It submits
  records, shows leaderboards and ghosts of other players' runs, and has a level browser and chat commands
  for world records, favourites and votes.
- **Auth**: signs players in with their Steam account and hands the mod a JWT.
- **Backend / JsonApi**: the REST API the mod talks to. It stores records and publishes each one to the
  `wr`, `pb` and `media` exchanges on RabbitMQ.
- **Processors**: services that consume those exchanges. The world record processor updates world records
  and publishes each new one to a `stream` exchange, the personal best processor updates personal bests,
  and the record media handler deals with the media attached to records.
- **Player points and level scores**: two calculators that run on a schedule and recompute players' points
  and levels' scores from the database.
- **Stream**: a WebSocket server that passes new world records from the `stream` exchange on to listeners
  such as the Discord bot.
- **[Database](https://github.com/donderjoekel/Zeepkist.GTR.Database)**: the Entity Framework Core model of the
  PostgreSQL database: users, levels, records, personal bests, world records and points.
- **[GraphQL](https://github.com/donderjoekel/Zeepkist.GTR.Graphql)**: the database is served as a GraphQL
  API through PostGraphile; this repo holds the GraphQL schema and queries and generates a typed C# client
  from them.
- **[Discord](https://github.com/donderjoekel/Zeepkist.GTR.Discord)**: a bot that receives new world records
  from Stream over a WebSocket and posts them to Discord.

The [main repo](https://github.com/donderjoekel/Zeepkist.GTR) holds the mod, the database and the retired merged
backend as Git submodules, with a Docker Compose self-hosting guide for that earlier, single-backend
version of GTR.
