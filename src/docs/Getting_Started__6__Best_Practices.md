---
title: "Best Practices"
description: ""
---

### Best Practices

**Avoid undeclared variables**
- JS-Confuser only renames variables you explicitly define, but undeclared variables can still cause issues.
- Always declare variables using `var`, `let`, or `const`.
- Avoid referencing global variables directly. Use `window.MyGlobalVar` instead of `MyGlobalVar`.

**Don't rely on `function.name`**
- [Rename Variables](../options/renameVariables) and related options will break this behavior. Most build tools recommend avoiding this pattern altogether.

**Don't use `eval()` to reference or modify local variables**
- See [Rename Variables](../options/renameVariables) for how to properly support this use case.

**If your code relies on `function.length`**
- Enable [Preserve Function Length](../options/preserveFunctionLength) to ensure `function.length` remains accurate.

**Avoid string-based placeholders**
- If your code uses string placeholders like `"COOKIE_NAME"`, replace them with identifiers such as `COOKIE_NAME`. Strings are heavily encoded by JS-Confuser and may not behave as expected.