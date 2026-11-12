# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## GUP management link

Set `NUXT_GUP_URL` to the browser-accessible base URL of GUP. For the local
`docker-gup-frontend-1` container, use `http://localhost:8181` (host port 8181
for container port 4200). When accessing the app from another computer, replace
`localhost` with the Docker host's hostname. Both Compose configurations pass
this variable to Nuxt at runtime. Recreate the app container after changing it.

## RIS downloads

The results toolbar downloads `publications.ris` using the current search filters
and sort order, independently of the displayed page. `POST /api/publications/export`
accepts the same filter object as the search endpoint. The server caps exports at
the first 10,000 records and reports truncation in `X-Export-Limited`; the UI shows
a message when this happens. Empty results disable the button, and errors can be
retried without leaving the list.

The serializer follows the original GUP `Publication#to_ris` field order and type
mapping, including `BOOK` for theses and reports. Type IDs are taken from GUP
admin's publication type catalogue; update `server/utils/ris.ts` if that catalogue
changes. Unknown types use `GEN`. Multiline values use indented continuation lines
to prevent embedded text from being interpreted as RIS tags.

Run the query and serializer checks with `npm test`.

## Relationship filters and project indexing

Faculty, institution, series and project selections are shared between search and
RIS downloads. Multiple values within a selection are ORed; different filter groups
are ANDed. Institution filtering includes descendants from the departments index's
`hierarchy` field. Department lookup failures return an error rather than broadening
the search.

The publication fields used are `authors.affiliations.faculty_id`,
`authors.affiliations.department_id`, `series.series_id` and `projects.project_id`.
**The current local publication index does not contain project relationships.**
Before project filtering can return matches, the upstream GUP publication document
must include a `projects` array with numeric `project_id` values from the current
publication version's project associations, and existing publications must be
reindexed. Map `projects` as an ordinary object array, consistent with `series`.
The standalone `projects` catalogue index supplies dropdown options; it does not
establish publication membership. Until publication memberships are indexed, a
project selection returns no matches. No upstream code or index was changed here.
