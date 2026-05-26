# custom-tools architecture

This folder is treated as a mini-application inside OROSAITOOLS. The refactor consolidates many peer folders into six architectural groups.

## Target folders

```txt
src/features/custom-tools/
├─ builder/      # draft creation UI, input editing, permission editing, builder state
├─ domain/       # types, lifecycle rules, templates, validation rules
├─ registry/     # published tools, publishing flow, history, published-tool storage
├─ runtime/      # dry-run, execution, file operations, runner workspace
├─ workflow/     # workflow editor/graph/model/rules
├─ shared/       # generic hooks, types, and feature-local utilities
└─ index.ts
```

## Move map

- `model` -> `domain`
- `inputs` -> `builder/components/inputs`
- `permissions` -> `builder/components/permissions`
- `builder/model` -> `builder/state`
- `persistence/customToolBuilderSessionStorage.ts` -> `builder/state`
- `persistence/customToolDraftStorage.ts` -> `builder/state`
- `persistence/publishedCustomToolsStorage.ts` -> `registry/storage`
- `publishing` -> `registry/publishing`
- `history` -> `registry/history`
- `runner` -> `runtime/runner`
- `files` -> `runtime/file`
- `runtime/model` -> `runtime/state`
- `validation/components` -> `builder/components/validation`
- `validation/model` -> `domain/validation/model`
- `validation/rules` -> `domain/validation/rules`

## Added shared primitives

- `shared/types/saveStatus.ts` centralizes save status naming.
- `shared/hooks/usePersistedResource.ts` provides a reusable debounce/load/save hook for draft/session persistence.
- `runtime/dry-run/blockHandlerRegistry.ts` provides a generic block-handler registry for future dry-run cleanup.
- `runtime/execution/guards/validateExecutionGuards.ts` centralizes execution guard semantics for Python/file-append safety.

## Notes

This migration intentionally avoids UI changes. It updates imports and adds reusable primitives, but deeper behavioral rewrites should be done after running the app and tests locally.
