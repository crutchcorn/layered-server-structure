Layered Server Structure (LSS) gives your backend code a clear home: `.route.ts` files wire endpoints, `middleware/` and `handlers/` own `req`/`res` concerns, and `services/` handle database and external I/O without coupling to your web framework.

This repository contains tools for adopting and enforcing LSS. Use them together or independently:

| Tool                                                             | Purpose                                                                                                                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Agent skill](skills/layered-server-structure/SKILL.md)          | Guide your coding agent when building, refactoring, or reviewing backend features and API routes.                                                                       |
| [ESLint plugin](https://www.npmjs.com/package/lss-eslint-plugin) | Check import boundaries, keep features independent, enforce `.route` and `.logic` naming and per-verb limits, and optionally validate the full `src/` folder structure. |

## Install the skill

Run this from the project where you want to use it:

```sh
npx skills add crutchcorn/layered-server-structure --skill layered-server-structure
```

Choose your agent in the installer. Add `--global` to make the skill available across projects, or `--agent codex` to target a specific agent. See the [Skills CLI documentation](https://github.com/vercel-labs/skills#install-a-skill) for supported agents and options.

Then ask your agent:

> Use layered-server-structure to refactor the users endpoints. Separate `req`/`res` handling from database services and organize `/users` and `/users/:id` under `features/users/`.

Or:

> Use layered-server-structure to review this server's import boundaries. Point out misplaced middleware, handlers, or services and show where they belong.

The skill is self-contained. It works across Hono, Fastify, Express, Koa, h3, and similar Node or WinterCG servers without requiring new runtime dependencies.

## Install the ESLint plugin

Install [`lss-eslint-plugin` from npm](https://www.npmjs.com/package/lss-eslint-plugin) alongside ESLint and `typescript-eslint` in your server project:

```sh
npm install --save-dev lss-eslint-plugin 'eslint@^10.12.0' typescript-eslint
```

Use your project's package manager when adding dependencies. The plugin ships a ready-to-use ESM bundle with TypeScript declarations; consumers need no build step.

Add the recommended rules to `eslint.config.mjs` in the directory containing `src/`:

```js
import tseslint from 'typescript-eslint'
import lss from 'lss-eslint-plugin'

export default [...tseslint.configs.recommended, ...lss.configs.recommended]
```

If you already have an ESLint configuration, keep its parser and rules and append `...lss.configs.recommended`. Then run:

```sh
npx eslint src
```

The recommended configuration checks handler imports in `src/**/handlers/`, logic imports in `src/**/*.logic.*`, service imports under `src/**/services/`, cross-feature imports under `src/**/features/`, and feature encapsulation across `src/**/` (blocking shared layers from importing `features/` and requiring external callers like `src/app.ts` to mount `<feature>.route.ts` instead of reaching into `routes/`). It also enforces descriptive `.route` and `.logic` filenames—allowing one unprefixed `<feature>.route.ts` at `features/<feature>/` and one verb-prefixed `<resource>.<verb>.route.ts` per verb inside `features/<feature>/routes/<name>/` (using `routes/index/` for `/`). For full TypeScript folder and filename enforcement, use `createLssConfig({ root: import.meta.dirname })` as described in the [plugin documentation](packages/eslint/README.md#optional-application-structure).

## Repository layout

- [`skills/`](skills/) contains installable agent skills.
- [`packages/`](packages/) contains reusable tools, including [`lss-eslint-plugin`](packages/eslint/).
- [`examples/`](examples/) contains working [Hono](examples/hono/) and [Fastify](examples/fastify/) example servers checked by `createLssConfig`.
- [`skills.sh.json`](skills.sh.json) configures the repository's Skills.sh page.

## Work with the skill locally

See [Contributing](CONTRIBUTING.md) to run repository checks and Promptfoo skill evaluations.

To check skill discovery from this checkout without installing it:

```sh
npx skills add . --list
```

To install this checkout's version locally:

```sh
npx skills add . --skill layered-server-structure
```
