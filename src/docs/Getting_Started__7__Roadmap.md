---
title: "Roadmap"
description: ""
slug: "getting-started/roadmap"
---

The following features are planned for JS-Confuser:

- VM Obfuscation: [JS-Confuser-VM](https://github.com/MichaelXF/js-confuser-vm) has started!
- Webpack & Build Plugins
- [X] Babel Rewrite
- - This will exponentially speed up obfuscation times
- - Improved obfuscation stability
- [X] Custom String Concealing functions
- [X] Custom Lock code / Dead code insertions
- Improved Code Transforms
- - Specifically designing obfuscations against modern AST analyzers
- - - Hard to track identifiers (re-assigned, eval, with statement)
- - - Hard to track prototype / internal JS logic (for opaque predicates)
- - - AST scrambler - reorganize the AST to worsen AST pattern matchers
- Improved API Interface

---

A '2.0 version' of JS-Confuser is currently in the works. 
Please feel free to suggest new features on the [GitHub issues page](https://github.com/MichaelXF/js-confuser).