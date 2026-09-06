# Releasing SDDx

SDDx publishes from the protected `main` branch through [`.github/workflows/publish.yml`](../.github/workflows/publish.yml).

## Release behavior

Every push to `main` starts the workflow. It:

1. Installs dependencies.
2. Runs tests and JavaScript checks.
3. Regenerates the capability catalog.
4. Confirms generated files are committed.
5. Reads the version from `package.json`.
6. Publishes a new version to npm with provenance.

npm does not allow the same package version to be published twice. If the version already exists, the workflow reports that it is already published and exits successfully. Bump the version before the next package release.

## One-time npm trusted publishing setup

The recommended setup uses npm trusted publishing with GitHub Actions, so no long-lived npm token is stored in GitHub.

In npm package settings, add a GitHub Actions trusted publisher with:

- Organization or user: `sanjeevanbiswas`
- Repository: `sddx`
- Workflow filename: `publish.yml`
- Environment: empty
- Allow direct `npm publish`: enabled

The package must be published once before its npm settings can be configured. For the first release, publish manually from a trusted local terminal:

```bash
npm login
npm publish --access public
```

After that, configure the trusted publisher and let GitHub Actions handle subsequent releases.

## Releasing a new version

Update the version, run the local checks, and push the commit to `main`:

```bash
npm version patch
npm test
npm run check
git push origin main
```

Use `npm version minor` or `npm version major` when the change requires it. Because `main` is owner-controlled, only the repository owner can trigger a publish by updating `main`.

Trusted publishing uses short-lived OIDC credentials and automatically creates npm provenance attestations. See the [npm trusted publishing guide](https://docs.npmjs.com/trusted-publishers/).
