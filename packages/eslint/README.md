[`lss-eslint-plugin`](https://www.npmjs.com/package/lss-eslint-plugin) enforces the import boundaries in Layered Server Structure (LSS), keeps each backend feature independent of its siblings, and checks `.route` and `.logic` naming and per-verb limits. It ships an ESM bundle and TypeScript declarations built with [tsdown](https://tsdown.dev/), so consumers can use it directly without a build step.

Install it in your server project:

```sh
npm install --save-dev lss-eslint-plugin 'eslint@^10.12.0' typescript-eslint
```

Compose its flat configuration after your application's parser configuration:

```js
import tseslint from 'typescript-eslint'
import lss from 'lss-eslint-plugin'

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...lss.configs.recommended,
)
```

The consumer supplies its JavaScript/TypeScript parser configuration. Paths are relative to the consuming ESLint configuration, so a backend config in `apps/backend` applies the rules to that application's `src` directory. The plugin does not configure or replace `no-restricted-imports`; application-specific restrictions can run alongside these rules.

| Rule                       | Recommended files                                      | Disallowed behavior                                                                                                                                    |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lss/handler-imports`      | `src/**/handlers/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}` | `services`, `middleware`, and `routes` path segments; `.route` and `.logic` modules                                                                    |
| `lss/logic-imports`        | `src/**/*.logic.{ts,js,mts,cts,mjs,cjs}`               | HTTP/WS router frameworks (`hono`, `fastify`, `express`, `koa`, `h3`, `@nestjs/*`), `middleware`, `handlers`, `routes`, and `.route` modules           |
| `lss/service-imports`      | `src/**/services/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}` | HTTP/WS router frameworks (`hono`, `fastify`, `express`, `koa`, `h3`, `@nestjs/*`), `middleware`, `handlers`, `routes`, `.route`, and `.logic` modules |
| `lss/feature-imports`      | `src/**/features/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}` | Imports that resolve into a different `features/<feature>` folder                                                                                      |
| `lss/encapsulate-features` | `src/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}`             | Shared layers importing `features/`, and callers outside `features/<feature>/` bypassing `<feature>.route` to reach `routes/` or feature internals     |
| `lss/route-files`          | `src/**/*.route.{ts,tsx,js,jsx,mjs,cjs,mts,cts}`       | `index` route names, verb-prefixed routes outside `routes/<name>/`, unprefixed routes inside `routes/<name>/`, and duplicate verbs in one folder       |
| `lss/one-logic-per-folder` | `src/**/*.logic.{ts,js,mts,cts,mjs,cjs}`               | `index` logic names, misplaced verb modifiers, more than one unprefixed `.logic` at a feature root, or duplicate verb `.logic` files in one folder     |

Handlers may import router request/response helpers, plain types, utilities, constants, and other handlers. Services may import database drivers, ORMs, validation libraries, `schema/`, other services, utilities, constants, and plain types. Type-only imports follow the same boundaries: move shared types into a `types/` module instead of importing them through a service, middleware, or sibling feature.

The import rules inspect static imports, re-exports, `import()` expressions, unshadowed `require()` calls, TypeScript import types, and TypeScript import-equals declarations. String literals and template literals without expressions are checked. `.route` and `.logic` imports are recognized with or without source/output extensions. Directory imports such as `../services`, Windows separators, and bundler query/fragment suffixes are also recognized.

Keep in mind that this is a static specifier check, not an import-graph resolver. Computed module names and indirect exports from otherwise permitted barrels aren't traced. Path aliases need to expose their layer segment (for example `@/services/db`); an opaque alias needs an application-specific restriction.

## Keep features independent and encapsulated

`lss/feature-imports` applies to every source file inside a `features/<feature>` folder—including `.route` and `.logic` files, sub-routes under `routes/<name>/`, and feature-scoped `middleware/`, `handlers/`, `services/`, and `utils/`. It reports any import whose module path resolves into a sibling feature folder, such as `../messages/utils/schema` from `src/features/users/users.route.ts`. Imports within the same feature (including from `routes/by-id/` up to `../../utils/schema`) and imports from shared `src/` layers are allowed.

`lss/encapsulate-features` protects feature boundaries from the outside: shared layers (`middleware/`, `handlers/`, `services/`, `schema/`, `utils/`, `constants/`, and `types/`) may never import from `features/`, and server entry points such as `src/app.ts` must mount a feature through its root `<feature>.route` module (or `index` barrel) rather than reaching directly into `features/<feature>/routes/<name>/` or internal helpers.

When two features—or a shared layer and a feature—need the same middleware, response handler, service, or schema, move it to the matching `src/`-level layer and make its interface generic enough for every consumer.

## Route and logic file rules

`lss/route-files` enforces how endpoint files scale from single-route features to multi-route resources:

- **Feature root (`features/<feature>/`):** Allows at most one unprefixed `<feature>.route.ts` file. A simple feature can define its route directly here; a multi-endpoint feature uses `<feature>.route.ts` to mount sub-routes from `routes/<name>/`. Verb-prefixed route files (such as `users.get.route.ts`) aren't allowed at the feature root.
- **Named sub-routes (`features/<feature>/routes/<name>/`):** Use `routes/index/` as the folder placeholder for `/` and descriptive kebab-case folders such as `routes/by-id/` for sub-paths like `/:id`. Inside `routes/<name>/`, every `.route` file must carry a supported verb or transport modifier (`get`, `post`, `put`, `patch`, `delete`, `options`, `head`, `ws`, `sse`), and each folder may contain at most one `.route` file per verb (for example, `users.get.route.ts` and `users.post.route.ts` can live side by side in `routes/index/`, while a second `.get.route.ts` belongs in its own `routes/<name>/` subfolder).
- **Descriptive filenames:** Route files may never be named `index.route.ts` or `index.<verb>.route.ts`—even inside `routes/index/`. Name them after the resource (`users.get.route.ts`, `user-by-id.get.route.ts`) so open files stay readable in editor tabs.

`lss/one-logic-per-folder` applies the exact same rules to optional `.logic.ts` orchestration files (`users.logic.ts` at the feature root; `users.get.logic.ts` and `users.post.logic.ts` inside `routes/index/`). Colocated `.spec.ts` and `.test.ts` files don't count toward either limit. Run ESLint without `--cache` after adding, removing, or renaming sibling `.route` or `.logic` files.

## Optional application structure

`createLssConfig({ root })` combines `lss.configs.recommended` with a full TypeScript server folder and filename policy powered by [`eslint-plugin-project-structure`](https://github.com/Igorkowalski94/eslint-plugin-project-structure):

```js
import tseslint from 'typescript-eslint'
import { createLssConfig } from 'lss-eslint-plugin'

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...createLssConfig({ root: import.meta.dirname }),
)
```

`root` must be the absolute application directory containing `src`; `import.meta.dirname` supplies it from the consuming `eslint.config.js`.

| Location                                     | Accepted contents                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src`                                        | Shared layers, `features`, `app.ts`, `index.ts`, `main.ts`, `server.ts`, and their tests                                         |
| `src/features/<feature>`                     | At most one `<feature>.route.ts` and `<feature>.logic.ts`; tests, `index.ts`, `routes/`, and feature-scoped layers               |
| `src/features/<feature>/routes/<route-name>` | At most one `<resource>.<verb>.route.ts` and `<resource>.<verb>.logic.ts` per verb; tests, `index.ts`, and route-scoped layers   |
| `middleware`, `handlers`, `schema`           | TypeScript modules, tests, and barrels                                                                                           |
| `services`, `constants`, `utils`             | TypeScript modules, tests, and barrels (`services/schemas` permits `*.d.ts` declarations; `utils/testing-utils` permits helpers) |
| `types`                                      | TypeScript modules and `*.d.ts` declarations                                                                                     |
| `assets`                                     | HTML, SQL, JSON, images, fonts, media, WebAssembly, and text assets                                                              |
