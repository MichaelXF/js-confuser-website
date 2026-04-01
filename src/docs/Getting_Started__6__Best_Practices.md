### Best Practices

**Avoid undeclared variables**
- While JS-Confuser only renames variables you explicitly define, problems arise with undeclared variables.
- You're advised to declare each variable you use with `var`/`let`/`const`
- Avoid accessing global variables directly. Instead use `window.MyGlobalVar` over `MyGlobalVar`

**Don't rely on `function.name`**
- [Rename Variables](../options/renameVariables) (and option options) will break this. It's recommended from most build tools to avoid this syntax.

**Don't use `eval()` to reference or modify local variables**
- See [Rename Variables](../options/renameVariables) to properly support this.

**If you rely on `function.length`**
- Enable the option [Preserve Function Length](../options/preserveFunctionLength) to help preserve the `function.length` if your code uses it.

**Avoid string-based placeholders**
- If your code has placeholders such as `"COOKIE_NAME"`, use an Identifier such as `COOKIE_NAME`, as strings are heavily encoded throughout JS-Confuser.