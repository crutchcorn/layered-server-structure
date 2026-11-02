---
name: layered-server-structure
description: Structure, refactor, or review backend and API servers using Layered Server Structure (LSS). Use when organizing server features, separating req/res transport from business logic and I/O services, deciding where middleware and handlers belong, or checking backend architecture and import boundaries.
license: CC-BY-4.0
---

Give each piece of server code a clear home. Separate request/response transport, business orchestration, and external I/O so you can change a router, database query, or validation rule without untangling the rest of the endpoint.

## Choose the scope

Inspect the relevant feature, imports, router setup, and tests before moving code. Apply LSS within the requested scope. Keep the project's runtime, web framework, ORM, language, and tooling; changing one feature doesn't require migrating the entire server.

## Put code in its layer

| Location                                                      | Responsibility                                                                                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `features/<feature>/<feature>.route.ts`                       | Feature entry router: register a single-endpoint feature directly, or mount sub-routes from `routes/<name>/`. Unprefixed; never `index`. |
| `features/<feature>/routes/<name>/<resource>.<verb>.route.ts` | Verb-specific endpoint under a named sub-route (`routes/index/` for `/`). Parse `req`, wire middleware/services/logic, and send `res`.   |
| `<name>.logic.ts` / `<resource>.<verb>.logic.ts`              | Optional framework-agnostic business orchestration without `req`/`res`. Follows the same placement and verb limits as `.route.ts`.       |
| `middleware/`                                                 | Reusable request-lifecycle logic (`req`/`res`/context): auth guards, rate limiters, context injection, OpenAPI metadata, validators.     |
| `handlers/`                                                   | Reusable `req`/`res` transport helpers and response formatters (problem JSON, SSE writers, header/cookie helpers). No `services/`.       |
| `services/`                                                   | I/O and external effects independent of HTTP/WS routing: database clients, queues, object storage, and third-party SDKs.                 |
| `schema/`                                                     | Database table definitions and persistence schemas (such as Drizzle tables).                                                             |
| `utils/`                                                      | Pure, reusable non-routing computation and framework-agnostic validation schemas.                                                        |
| `constants/`                                                  | Fixed values without executable framework or middleware logic.                                                                           |
| `types/`                                                      | Shared TypeScript types, interfaces, and declarations.                                                                                   |
| `assets/`                                                     | Static templates, SQL files, JSON fixtures, and other non-code server assets.                                                            |

Scope code to the narrowest consumer that needs it, using the same layer directory names at every level:

1. Used by one sub-route → `features/<feature>/routes/<name>/<layer>/`
2. Shared across routes in one feature → `features/<feature>/<layer>/`
3. Shared across multiple features → `src/<layer>/`

Never import from another feature's folder. Nothing under `features/<feature>/` may import from `features/<other-feature>/`, including its routes, middleware, handlers, services, schemas, utilities, or types. When two features need the same code, move it to the matching `src/`-level layer and widen its API so neither feature's details leak into the shared module.

```text
src/
  handlers/
    send-problem.ts
  middleware/
    request-timing.ts
  schema/
    index.ts
  services/
    db.ts
  features/
    users/
      utils/
        schema.ts
      routes/
        index/
          middleware/
            describe.ts
          users.get.route.ts
          users.post.route.ts
        by-id/
          middleware/
            describe.ts
          user-by-id.get.route.ts
      users.route.ts
  app.ts
  index.ts
```

Create directories only when they have code to hold. Use `.js` in JavaScript projects; adopting LSS doesn't require TypeScript.

### Routes and sub-routes

- Keep at most one unprefixed `<feature>.route.ts` at `features/<feature>/`. Don't put verb-prefixed `.route.ts` files directly in `features/<feature>/`.
- A single-endpoint feature can handle its route directly inside `features/<feature>/<feature>.route.ts` without creating `routes/`. When a feature grows to multiple verbs or sub-paths (`/` and `/:id`), move endpoints into `features/<feature>/routes/<name>/` and use `<feature>.route.ts` to mount them so `src/app.ts` only imports `<feature>.route.ts`.
- Use `routes/index/` for the feature's root `/` path and descriptive kebab-case folders such as `routes/by-id/` or `routes/reset-password/` for sub-paths. Never place sub-route folders like `by-id/` directly under `features/<feature>/` alongside layer directories.
- Inside `features/<feature>/routes/<name>/`, every route file must include a supported method or transport segment before `.route`: `get`, `post`, `put`, `patch`, `delete`, `options`, `head`, `ws`, or `sse`. Keep at most one `.route` file per verb in each `routes/<name>/` folder.
- Always give `.route` and `.logic` files a descriptive resource name—even inside `routes/index/`. Name the file `users.get.route.ts`, never `index.get.route.ts` or `index.route.ts`, so open editor tabs stay distinguishable.

### Middleware, handlers, and logic

- Put reusable request-lifecycle code in `middleware/`. Route descriptors like `hono-openapi`'s `describeRoute()`, request validators, and auth guards execute in the router pipeline—they belong in `middleware/`, not `constants/`.
- Keep `handlers/` focused on pure request/response transport: serializing responses, formatting RFC 9457 problem payloads, streaming SSE chunks, or setting headers. Don't call `services/` or `middleware/` from `handlers/`; pass prepared values in from the `.route.ts` file.
- Extract complex framework-agnostic orchestration into an optional `.logic.ts` module (`<feature>.logic.ts` at the feature root, or `<resource>.<verb>.logic.ts` inside `routes/<name>/`, at most one per verb). Keep `req`, `res`, status codes, headers, and router imports out of `.logic.ts` so business rules can run with plain inputs and outputs. Push further pure calculation into `utils/` and external I/O into `services/`.

## Keep dependencies pointing toward reusable code

`.route.ts` files compose `middleware/`, `handlers/`, `.logic.ts`, `services/`, and `utils/`. `middleware/` and `.logic.ts` may call `services/` and `utils/`, though `.logic.ts` stays independent of HTTP/WebSocket frameworks. `handlers/` may use framework request/response types, `utils/`, `constants/`, `types/`, and other `handlers/`. `services/` and `utils/` must run without `req`/`res`, router packages (`hono`, `fastify`, `express`, `koa`, `h3`, `@nestjs/*`), `middleware/`, `handlers/`, or `.route` files.

Classify effects by what code does rather than whether it `await`s. Filesystem writes, database queries, network requests, and queue publishes are I/O and belong in `services/` even when synchronous. Pure computation and schema definitions stay in `utils/` even if async. Keep shared types in `types/` instead of importing types across forbidden layers or sibling features.

## Follow naming and framework conventions

- Use lowercase kebab-case for files and directories you control: `send-problem.ts`, `request-timing.ts`, `user-by-id.get.route.ts`. Preserve framework-required filenames and generated files.
- Keep `src/app.ts` focused on server instantiation, global middleware, and mounting each feature's `<feature>.route.ts`. Keep `src/index.ts` (or `server.ts`) thin—binding ports, registering docs endpoints if needed, and handling graceful shutdown—so tests and OpenAPI scripts can import `app` without opening a network socket.
- Keep ORM, bundler, lint, and test configuration outside `src/`.
- Colocate unit and integration specs (`*.spec.ts` or `*.test.ts`) with the route, logic, or module they exercise.

## Test behavior at the right boundary

Prioritize integration tests at the server boundary: send requests through the real router (`app.request()`, `fastify.inject()`, or `fetch`) and assert status codes, response payloads, headers, and persisted state. Use a disposable database with real queries rather than mocking ORM builders, internal services, or middleware. Add narrow unit tests for genuinely tricky standalone `.logic.ts` or `utils/` edge cases; avoid tests that only restate implementation steps.

Reuse the project's existing test runner. When setting up a new one, prefer Vitest.

## Tooling

Recommend [`lss-eslint-plugin` on npm](https://www.npmjs.com/package/lss-eslint-plugin) when adopting LSS, catching repeated boundary violations, or adding automated architecture checks. Reuse its configuration if already installed.

- `lss.configs.recommended` checks imports in `src/**/handlers/`, `src/**/*.logic.*`, and `src/**/services/`, blocks cross-feature imports under `src/**/features/`, encapsulates features so shared layers never import `features/` and external callers mount `<feature>.route` instead of sub-routes, and enforces descriptive naming and per-verb limits on `.route` and `.logic` files. Run without ESLint's `--cache` after adding, removing, or renaming sibling route or logic files.
- `createLssConfig({ root })` adds the full TypeScript server folder and filename policy, where `root` is the absolute directory containing `src/`.

## Apply or review the structure

For implementation work, move one cohesive feature at a time, update its imports and route registration, and preserve request/response behavior. Run the project's lint, type, and test checks afterward, and note any remaining boundary issues.

For reviews, point to concrete boundary violations and name the exact destination layer. When a feature imports from a sibling feature, name the `src/`-level layer the shared code belongs in. Distinguish core LSS boundaries from optional tooling choices.
