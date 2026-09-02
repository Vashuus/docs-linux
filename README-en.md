# ShellLinux — Linux command documentation

Static website to browse Linux commands and a collection of maintenance scripts.
Light/dark theme, syntax highlighting, quick copy and a script viewer with
download.

> Versión en español: [README.md](README.md)

## Features

- Command catalog organized by section (syntax, options and examples).
- **Scripts** section with a modal viewer, syntax highlighting, copy and download.
- Persistent light/dark theme.
- Responsive and lightweight, no backend.
- Content stored in easy-to-extend JSON files.
- Data validation and CI (lint, secrets, container).

## Running it

### With Docker (recommended)

```bash
docker compose up -d
# Open http://localhost:8090
```

Editing `html/`, `css/`, `js/`, `data/`, `svg/` or `scripts/` reloads the site
automatically (browser-sync with read-only volumes).

### Without Docker

Requires Node.js 20+.

```bash
npm install -g browser-sync@2.29.3
browser-sync start --config browser-sync.config.js
# Open http://localhost:8080
```

## Project layout

```
html/      index.html (page)
css/       styles (theme, layout, modal...)
js/        site logic (ES modules)
data/      content: sections.json, commands/, scripts/
svg/       icons (see svg/icons.txt)
scripts/   published shell scripts
tools/     validator and JSON schemas
```

## Adding content

Everything lives under `data/`:

- **Section**: add an entry to `data/sections.json`.
- **Command**: create `data/commands/<id>.json`.
- **Script**: create `data/scripts/<id>.json` and the file in `scripts/<id>.sh`.
- **Icon**: check the available ones in `svg/icons.txt`.

Rules: the `id` must match the file name (`a-z0-9-`), and you may only reference
files that exist in the repository.

Before submitting changes:

```bash
node tools/validate.mjs
```

## Deployment

The site is published to GitHub Pages via `.github/workflows/pages.yml`, which
assembles the content and deploys it. To enable it: **Settings → Pages → Source:
GitHub Actions**.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Ideas and command/script requests are
welcome through issues.

## Security

See [SECURITY.md](SECURITY.md). SVG icons are sanitized client-side before being
rendered.

## License

[GPL-3.0](LICENSE).

## Conventions

- User-facing documentation: **Spanish**.
- Code, script comments and commit messages: **English**.
