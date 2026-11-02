# lss-eslint-plugin

## 0.1.0

### Minor Changes

- 6383106: Add `lss/encapsulate-features` rule to prevent shared layers from importing `features/` and require external callers to mount features through `<feature>.route`.
- 32e0b70: Add `lss/middleware-imports` rule to keep `middleware/` independent of `routes/`, `.route`, and `.logic` modules.
- 6deaf2a: Add `lss/pure-imports` rule to keep `utils/`, `schema/`, `constants/`, and `types/` free of services, middleware, handlers, routes, `.logic` modules, and runtime router frameworks.

## 0.0.1

### Patch Changes

- 7956143: Initial release
