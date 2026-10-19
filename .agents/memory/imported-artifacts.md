---
name: Imported artifact registration
description: Recover artifact registration after a GitHub import without replacing existing application code.
---

An imported artifact manifest can exist on disk even when the platform reports no artifacts or workflows. Preserve the imported app rather than scaffolding a replacement.

**Why:** GitHub imports may retain manifests but lose platform registration. Revalidating an unchanged manifest registered the existing artifacts and their managed workflows in this workspace.

**How to apply:** Compare the platform's artifact list with on-disk manifests. If registration is missing, use the artifacts skill's validated temporary-file replacement flow on the existing manifest, then inspect the resulting managed workflows. Do not create duplicate workflows or overwrite the imported application.
