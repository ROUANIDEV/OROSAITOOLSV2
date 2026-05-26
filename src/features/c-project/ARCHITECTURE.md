# C Project feature architecture

## Main folders

- `workspace/` — screen-level scanner workspace and scanner UI flow.
- `csc/` — CSC folder selection and CSC scan-result presentation.
- `state/` — state shape, persisted-state helpers, and scanner action hook.
- `domain/` — pure selectors, formatters, and UI-paint utility facade.
- `shared/` — small presentational atoms used inside this feature.

## Compatibility

By default the patch leaves compatibility re-export files at the old paths, such as
`components/scanner/*`, `components/csc/*`, `types/*`, `hooks/*`, and
`utils/*`. They are intentionally thin aliases so the migration is safe while
other feature folders are being refactored.

After `npm run build` passes and no imports use the old paths, you can remove the
legacy alias folders in a follow-up cleanup commit.
