# Discoverability and release guide

SDDx should be discoverable because it clearly solves real problems, not because it repeats unrelated search terms. npm search uses the package name, description, README, and keywords, so those fields should describe the actual product. GitHub topics make a repository discoverable by subject and use case.

## Positioning

Primary positioning:

> Agent-neutral SDLC toolkit for spec-driven development, architecture, skills, verification, debugging, DevOps, and delivery workflows.

Supported ecosystems can be named accurately: OpenAI Codex, Claude Code, Cursor, GitHub Copilot, Windsurf, OpenCode, and generic Agent Skills layouts. SDDx must not imply endorsement by any platform.

## npm metadata

Keep the package description focused on the product outcome. The keyword list covers genuine search intent:

- `sdd`, `sdlc`, `spec-driven-development`, `openspec`
- `agentic-ai`, `agentic-engineering`, `ai-agents`, `ai-coding-agent`, `coding-agents`
- `openai`, `codex`, `agent-skills`
- `system-design`, `software-architecture`, `product-discovery`, `ux-design`
- `debugging`, `tdd`, `devops`, `developer-tools`, `engineering-workflow`

Do not add unrelated trending terms just to increase impressions. Relevance improves trust and reduces the risk of the package looking like keyword spam.

## Suggested GitHub topics

Add no more than 20 relevant lowercase topics in the repository settings:

```text
sdlc
sdd
spec-driven-development
agentic-ai
agentic-engineering
ai-coding-agent
ai-agents
openai-codex
agent-skills
software-architecture
system-design
product-discovery
ux-design
debugging
tdd
devops
developer-tools
claude-code
cursor
github-copilot
```

## README conversion path

The first screen should answer four questions quickly:

1. What is SDDx?
2. Which agents and platforms work with it?
3. What command installs it?
4. What happens after initialization?

The README should link to practical examples for a full feature, a small change, a bug, architecture work, technology adoption, and a focused one-skill install. Those examples are more useful for discovery than a long list of abstract capabilities.

## Release checklist

Before publishing a release:

```bash
npm test
npm run check
npm run catalog
npm pack --dry-run
npm view @sung1-labs/sddx version
```

The package is configured for public scoped publishing. The first release should still be published explicitly and intentionally:

```bash
npm login
npm whoami
npm publish --access public
```

Scoped packages are private by default on npm, so public visibility must be selected for the first release. See the [npm scoped publishing guidance](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/).

Review the tarball for the README, usage guide, root license, third-party notices, source manifest, schemas, workflow skills, and selected capability sources. Publish only after the package contents and version are correct.

After publishing:

- Create a GitHub release with a practical change summary.
- Add or update repository topics.
- Publish a short usage example for one full workflow and one focused profile.
- Track installation failures and confusing handoffs as issues.
- Keep upstream updates manual and documented.

No search engine can guarantee that every query returns SDDx. Consistent naming, useful examples, accurate metadata, releases, and real user adoption are the sustainable path to broad discovery.
