# Layered Server Structure Oxlint plugin

Enforce Layered Server Structure (LSS) in JavaScript and TypeScript with Oxlint.

## Setup

```sh
npm install --save-dev oxlint lss-oxlint-plugin
```

Add an `oxlint.config.mjs` at the root of your application and extend the recommended preset.

```js
import { configs } from 'lss-oxlint-plugin'

export default {
  extends: [configs.recommended],
}
```

Run `npx oxlint` from that directory. The preset uses the same rule IDs and file scopes as the [ESLint preset](https://github.com/crutchcorn/layered-server-structure/tree/main/packages/eslint).

## Optional file and folder structure

Use `createLssConfig` to apply the recommended rules and check paths against the LSS application layout.

```js
import { createLssConfig } from 'lss-oxlint-plugin'

export default {
  extends: [createLssConfig({ root: import.meta.dirname })],
}
```

Keep the config in the application directory containing `src/` so the file patterns resolve from that directory. In a monorepo, put a config in each application directory where you want these rules.

Oxlint runs the folder check on JavaScript and TypeScript files. Use the [ESLint structure preset](https://github.com/crutchcorn/layered-server-structure/tree/main/packages/eslint#optional-application-structure) to check assets and other non-code paths.

## Configure individual rules

For a JSON config or custom file scopes, register the plugin with the `lss` alias and enable the rules you want.

```json
{
  "jsPlugins": [{ "name": "lss", "specifier": "lss-oxlint-plugin" }],
  "overrides": [
    {
      "files": ["src/**/services/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}"],
      "rules": { "lss/service-imports": "error" }
    }
  ]
}
```
