---
name: Orval generation compatibility
description: Node and Zod version mismatches that affect API schema code generation
---

Orval 8.43 can use `Map.groupBy` during generation, which is not available in this workspace's Node 20 runtime. Its Zod generator also defaults to Zod 4 output even though the API schema package uses Zod 3. A numeric `override.zod.version: 3` keeps generated schemas compatible; a string `"3"` is not equivalent.

**Why:** code generation otherwise fails at runtime or emits schema methods that do not exist in the workspace's installed Zod version.

**How to apply:** when codegen fails on `Map.groupBy`, apply a temporary polyfill only to the generator process. Keep the Zod output version aligned with the package dependency rather than upgrading dependencies just to satisfy the generator.
