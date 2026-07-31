# inventory-system-react

React 19 + TypeScript + Vite inventory management app. TanStack Router (file-based routes in `src/routes/`), TanStack Query for server state, react-hook-form + zod for forms, axios via `src/lib/apiClient.ts`. UI comes from the in-repo LumenUI component library (`src/components/`, `LUI*` prefix).

## Structure

- `src/features/<domain>/` — one folder per feature; pages live in `components/`, re-exported through the feature's `index.ts`.
- `src/features/setup/shared/` — generic master-CRUD building blocks (`createMasterApi`, `createMasterQueries`, `MasterListPage`, `MasterForm`). Setup pages (category, packing, tax type, unit) are one-liners passing `title` + `endpoint`.
- API fields use snake_case (`is_active`, `tax_rate`). Paginated responses are `IPaginatedResponse` (`content`, `totalElements`) from `src/types/apiResponse.types.ts`.

## Commands

- `npm run dev` — start dev server
- `npx tsc -b` — type-check
- `npm run lint` — eslint

## Code style

- Do not add comments that restate what the code already says. Only comment what the code cannot express: non-obvious constraints, workarounds, and the "why" behind decisions. Self-explanatory code stays comment-free.
- Prefer deriving types (`ReturnType`, `z.infer`) over hand-written duplicates.
- Remove unused exports, props, and helpers instead of keeping them "just in case".
