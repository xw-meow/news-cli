# Plugin System Design

**Date:** 2026-06-17
**Status:** draft

## Overview

Add a `news plugin` command group that supports dynamic plugin loading, install (URL / npm), uninstall, list, and update. Plugins can register new `NewsSource` instances as well as extend the CLI with new commands.

## Architecture

### New module: `src/plugin/`

```
src/plugin/
  types.ts      — Plugin interface + PluginRegistry type
  loader.ts     — dynamic plugin loading (local → global, local wins)
  installer.ts  — install logic (URL download / npm install)
  manager.ts    — uninstall / list / update
  cli.ts        — plugin subcommand registration (news plugin ...)
```

### Plugin Interface

```ts
import type { Command } from 'commander';

interface Plugin {
  /** 插件唯一标识 */
  name: string;
  /** 语义化版本 */
  version: string;
  /** 注册入口：插件内部调用 program.command(...) 和 registry.registerSource(...) */
  register(program: Command, registry: PluginRegistry): void | Promise<void>;
}

/** 扩展 registry，同时支持 NewsSource 和其他注册能力 */
interface PluginRegistry {
  registerSource(source: NewsSource): void;
  // 未来可扩展更多注册方法（formatter、middleware 等）
}
```

### Plugin directory structure

Each plugin lives in its own directory under `.news-plugins/`:

```
.news-plugins/
  some-plugin/
    package.json       ← "type": "module", + "main"/"version"
    node_modules/      ← plugin's own dependencies (isolated)
    index.js           ← entry point (must export named export `plugin`)
```

## Loading Flow

On `news` startup, before `program.parse()`:

```
1. Scan <cwd>/.news-plugins/ — each subdirectory with package.json
   → dynamic import() the entry file
   → call plugin.register(program, registry)

2. Scan ~/.news-plugins/ — same logic
   → skip any plugin name already loaded in step 1 (local overrides global)

3. program.parse() as usual
```

- Loading uses `await import(pathToFileURL(...))` for ESM support.
- If a plugin fails to load (syntax error, missing export): warn to stderr, skip it, continue with remaining plugins — never block CLI startup.
- `register()` can be async (awaited before proceeding to next plugin).

## CLI Commands

All under `news plugin` subcommand group:

```bash
news plugin install <url>              # Download file/zip, local install (default)
news plugin install <url> -g           # Download file/zip, global install
news plugin install <url> --force      # Overwrite existing plugin directory
news plugin install <npm-package>      # npm install, local (default)
news plugin install <npm-package> -g   # npm install, global
news plugin install <npm-package> --force  # Overwrite existing plugin directory

news plugin uninstall <name>           # Remove local plugin
news plugin uninstall <name> -g        # Remove global plugin

news plugin list                       # List installed plugins with load path
news plugin list --json                # JSON output

news plugin update <name>              # Update plugin (re-download / npm update)
news plugin update <name> -g           # Update global plugin
```

`-g` flag controls target directory:
- Without `-g`: `<cwd>/.news-plugins/<name>/`
- With `-g`: `~/.news-plugins/<name>/`

## Install Logic

### URL install (`news plugin install <url>`)

1. Inspect URL suffix:
   - `.zip` → download → extract to target directory
   - other (`.js`, `.mjs`, no extension) → download single file

2. Determine plugin name from filename: `foo.js` → `foo`, `bar.zip` → `bar`

3. Target path: `<base>/.news-plugins/<name>/`

4. Auto-generate `package.json`:
   ```json
   {
     "name": "<name>",
     "version": "0.1.0",
     "type": "module",
     "news-plugin": { "source": "<original-url>" }
   }
   ```

5. For zip extraction, entry file resolution:
   - If zip has a single top-level directory (common with GitHub archives: `repo-branch/`), strip it and use contents directly
   - If zip contains `package.json` with `"main"` field → use that as entry
   - Otherwise, look for `index.js` → `plugin.js` → `<name>.js` (first match, searched recursively up to 2 levels deep)
   - If none found → error: "Cannot determine entry point"

6. Persist install source in generated `package.json` under `"news-plugin"` metadata:
   ```json
   { "news-plugin": { "source": "<original-url>" } }
   ```
   This enables `news plugin update` to re-download.

7. If target directory already exists → error with hint to use `--force`

### npm install (`news plugin install <npm-package>`)

**Requirement:** npm packages intended as news-cli plugins must export a named `plugin` that satisfies the `Plugin` interface.

1. Ensure target directory exists, run `npm init -y` if no `package.json`
2. `npm install <package>`
3. Generate thin wrapper `index.js`:
   ```js
   export { plugin } from '<package>';
   ```
4. If the package has no `plugin` export after install → warn to stderr (the plugin simply won't load at runtime, but install is recorded)

### Error handling for install

- URL download timeout/404 → reuse existing `fetchText` retry logic → `PLUGIN_INSTALL_FAILED`
- npm install fails → clean up target directory → `PLUGIN_INSTALL_FAILED`
- Plugin already installed → `PLUGIN_ALREADY_INSTALLED`, suggest `--force`

## Uninstall Logic

```
news plugin uninstall <name> [-g]
→ remove <base>/.news-plugins/<name>/ (recursive)
→ if not found → PLUGIN_NOT_FOUND
```

## List Logic

```
news plugin list
→ scan both <cwd>/.news-plugins/ and ~/.news-plugins/
→ for each plugin found, show: name, version (from package.json), load path, local/global marker
→ indicate which one is active when duplicates exist (local overrides global)
```

## Update Logic

- **npm plugins**: `npm update` in the plugin directory
- **URL plugins**: re-download from the stored source URL (need to persist origin in plugin's `package.json` under `"news-plugin"` metadata)

## Error Codes (new)

```ts
type ErrorCode = ... | 
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_ALREADY_INSTALLED'
  | 'PLUGIN_LOAD_FAILED'
  | 'PLUGIN_INSTALL_FAILED';
```

## Testing

New test directory `test/plugin/`:

| File | Coverage |
|------|----------|
| `loader.test.ts` | Load order, local override global, load-failure skips gracefully, async register |
| `installer.test.ts` | URL download (.js and .zip), npm install, package.json generation, entry resolution |
| `manager.test.ts` | list, uninstall, update |
| `types.test.ts` | Plugin interface compliance |

## Build Considerations

Plugin loading uses `await import()`. esbuild by default tries to bundle dynamic imports — need to mark plugin paths as external or use `--format=esm` with dynamic import preserved. The loader will construct paths at runtime, so esbuild won't see them — but verify this doesn't cause warnings.

## Implementation Order

1. `src/plugin/types.ts` — Plugin interface + `PluginRegistry`
2. `src/plugin/loader.ts` — dynamic loading with override logic
3. Integrate loader into `src/index.ts` (before `program.parse()`)
4. `src/plugin/installer.ts` — URL + npm install
5. `src/plugin/manager.ts` — list / uninstall / update
6. `src/plugin/cli.ts` — commander subcommand registration
7. Register `pluginCli` command in `src/cli.ts`
8. Tests for each module
9. Update README
