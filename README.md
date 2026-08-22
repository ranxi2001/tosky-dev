# Tosky

The official website for Tosky, an independent software studio by Onefly.

## Local development

This is a dependency-free static website. Serve the repository root with any local HTTP server:

```bash
npx http-server . -p 4173 -c-1
```

Then open `http://localhost:4173`.

## Deployment

The production site is deployed on Cloudflare Pages:

```bash
npx wrangler pages deploy dist --project-name tosky-dev
```

Preview screenshots, Git metadata, and local tooling files are excluded from source control and should not be uploaded as site assets.
