# `check` helper

[🔝 REserve documentation](README.md)

REserve offers a method to **check a configuration**.

```typescript
function check (configuration: Configuration): Promise<Configuration>
```

> Types definition for `check`

The configuration must comply with the properties and mappings [documented here](configuration.md), otherwise the promise is rejected with the configuration error.
