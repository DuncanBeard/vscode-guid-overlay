# Security Audit Report
## VS Code GUID Visual Overlay Extension

**Audit Date:** 2026-01-23
**Extension Version:** 1.0.2
**Auditor:** Claude (Anthropic)

---

## Executive Summary

This security audit examined the VS Code GUID Visual Overlay extension for security vulnerabilities and VS Code extension best practices violations. The extension is a simple, well-architected tool that generates deterministic visual avatars for GUIDs/UUIDs.

**Overall Security Rating:** ⚠️ MEDIUM-LOW RISK

The extension has **1 HIGH severity security issue** and several best practices violations that should be addressed before wider distribution.

---

## Critical Findings

### 🔴 HIGH SEVERITY: Untrusted Markdown with HTML Enabled

**Location:** `src/hoverProvider.ts:62-63`

```typescript
markdown.isTrusted = true;
markdown.supportHtml = true;
```

**Issue:**
The hover provider marks markdown as trusted and enables HTML support. While the current implementation only uses internally-generated SVG data URIs, this creates an unsafe foundation:

1. **SVG Injection Risk:** SVG content can contain embedded JavaScript via `<script>` tags or event handlers
2. **Future Vulnerability:** If the code is ever modified to include user-controlled content, it becomes immediately exploitable
3. **XSS Vector:** An attacker who can control the GUID input (or if bugs exist in the GUID detection) could inject malicious SVG/HTML

**Attack Scenario:**
- If a malicious GUID pattern bypasses validation or if the avatar generation library has vulnerabilities, an attacker could inject JavaScript through SVG event handlers like `onload`, `onerror`, or embedded `<script>` tags
- The extension runs with VS Code's trust model, so XSS could access workspace files, settings, and potentially execute code

**Severity Justification:**
While the current code path appears safe (GUIDs are validated and SVG is generated from trusted libraries), the security controls are insufficient:
- No Content Security Policy validation
- No SVG sanitization
- Marking content as "trusted" removes VS Code's built-in protections
- Sets a dangerous precedent for future modifications

**Recommendation:**
```typescript
// Option 1: Remove HTML support entirely (RECOMMENDED)
markdown.isTrusted = false;  // Let VS Code apply its security controls
markdown.supportHtml = false;

// Option 2: If HTML is required, sanitize SVG content
markdown.isTrusted = true;
markdown.supportHtml = true;
// Add: const sanitizedSvg = sanitizeSvg(identity.avatarSvg);
```

**Additional Mitigation:**
- Implement SVG sanitization to strip `<script>`, event handlers, and `javascript:` URIs
- Add Content Security Policy headers if possible
- Document why HTML/trusted mode is necessary if it cannot be avoided

---

## Medium Severity Findings

### 🟡 MEDIUM: Dependency Vulnerabilities

**Location:** `package.json` dependencies

**Issue:**
NPM audit revealed 2 low severity vulnerabilities:

```
mocha (v11.7.5) - indirect vulnerability via diff package
  - CVE: GHSA-73rr-hh4g-fpgx
  - Issue: Denial of Service in parsePatch/applyPatch
  - Severity: Low
  - Fix: Downgrade to mocha@11.3.0 or wait for mocha@12.x
```

**Impact:**
Limited impact since mocha is a dev dependency only and not included in the published extension. However, it poses risks to:
- Development environments
- CI/CD pipelines
- Contributors running tests

**Recommendation:**
```bash
# Immediate fix
npm install mocha@11.3.0 --save-dev

# Or wait for mocha to fix the dependency
npm update mocha
```

---

### 🟡 MEDIUM: Missing Security Metadata

**Location:** `package.json`

**Issue:**
The extension package is missing several security-related fields:

1. **No bugs/security reporting URL**
   - Users cannot easily report vulnerabilities
   - Missing `bugs.url` field

2. **No homepage**
   - Users cannot verify the extension's authenticity
   - Missing `homepage` field

3. **Broad activation event**
   - `"onStartupFinished"` activates the extension on every VS Code startup
   - Better: Use `"onLanguage:*"` or specific file types

**Recommendation:**
```json
{
  "bugs": {
    "url": "https://github.com/DuncanBeard/vscode-guid-overlay/issues"
  },
  "homepage": "https://github.com/DuncanBeard/vscode-guid-overlay#readme",
  "activationEvents": []  // VS Code 1.75+ doesn't require this with contributes
}
```

---

## Low Severity Findings

### 🟢 LOW: ReDoS Vulnerability in GUID Pattern

**Location:** `src/guidDetector.ts:18`

```typescript
const GUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
```

**Issue:**
While the regex itself is not vulnerable to catastrophic backtracking, the global flag `g` with `exec()` in a while loop (line 48) could cause performance issues on very large files with many GUID-like patterns.

**Impact:**
Minimal - would require extremely large files with thousands of GUIDs to cause noticeable slowdown. Not exploitable for DoS in typical usage.

**Recommendation:**
Consider adding a performance limit:
```typescript
const MAX_GUIDS_PER_LINE = 100; // Reasonable limit
let matchCount = 0;
while ((match = pattern.exec(text)) !== null) {
  if (++matchCount > MAX_GUIDS_PER_LINE) break;
  // ... rest of code
}
```

---

### 🟢 LOW: No Input Length Validation

**Location:** `src/guidDetector.ts:43` and `src/hoverProvider.ts:28`

**Issue:**
No validation of input text length before regex processing. Extremely long lines (>1MB) could cause performance degradation.

**Impact:**
Limited - VS Code typically limits line length, and the regex is efficient. Edge case only.

**Recommendation:**
```typescript
export function findGuids(text: string): GuidMatch[] {
  if (text.length > 1_000_000) {
    return []; // Skip extremely long inputs
  }
  // ... rest of code
}
```

---

### 🟢 LOW: Console Logging in Production

**Location:** `src/extension.ts:17, 49`

```typescript
console.log('GUID Visual Overlay extension activated');
console.log('GUID Visual Overlay extension deactivated');
```

**Issue:**
Console logging should be removed or controlled via VS Code's output channels in production code.

**Impact:**
- Clutters VS Code's developer console
- Could leak sensitive information in debug scenarios
- Not following VS Code best practices

**Recommendation:**
```typescript
// Option 1: Remove entirely
// console.log('...');

// Option 2: Use VS Code output channel
const outputChannel = vscode.window.createOutputChannel('GUID Visual Overlay');
outputChannel.appendLine('Extension activated');
```

---

## VS Code Extension Best Practices Violations

### 📋 Missing Required Files

1. **CHANGELOG.md** - Excluded in .vscodeignore but users expect it
2. **LICENSE file** - Package.json specifies MIT but no LICENSE file exists
3. **.vscodeignore excludes too much** - Test files should be excluded, but currently hides too much

**Recommendation:**
```bash
# Create LICENSE file
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 Duncan Beard

Permission is hereby granted, free of charge...
EOF

# Fix .vscodeignore
# Remove: CHANGELOG.md (should be included)
# Add: Any sensitive test data
```

---

### 📋 Package.json Best Practices

**Missing Recommended Fields:**
- `keywords` - Helps discoverability on marketplace
- `preview` - Should be true for pre-1.0 versions (though you're at 1.0.2)
- `pricing` - Should explicitly state "Free"

**Recommendation:**
```json
{
  "keywords": ["guid", "uuid", "visualization", "avatar", "identifier"],
  "pricing": "Free",
  "qna": "marketplace",
  "badges": [
    {
      "url": "https://img.shields.io/github/license/DuncanBeard/vscode-guid-overlay",
      "href": "https://github.com/DuncanBeard/vscode-guid-overlay",
      "description": "License"
    }
  ]
}
```

---

### 📋 Hover Provider Selector Too Broad

**Location:** `src/hoverProvider.ts:84`

```typescript
{ scheme: '*', language: '*' }
```

**Issue:**
Registers hover provider for ALL schemes and languages, including:
- Remote files (SSH, WSL, Dev Containers)
- Untrusted workspaces
- Binary files
- Non-text files

**Recommendation:**
```typescript
// More specific selector
{ scheme: 'file', language: '*' }
// Or even better, specific schemes
[
  { scheme: 'file' },
  { scheme: 'untitled' }
]
```

---

### 📋 No Tests Included

**Location:** `src/test/extension.test.ts`

**Issue:**
Test file exists but appears to be a placeholder or minimal test. .vscodeignore excludes `out/test/**`, so tests aren't published (good), but comprehensive tests should exist.

**Recommendation:**
- Add unit tests for GUID detection edge cases
- Add tests for visual identity generation
- Test hover provider with malformed inputs
- Add integration tests with sample files

---

### 📋 TypeScript Configuration

**Location:** `tsconfig.json`

**Good practices followed:**
- ✅ Strict mode enabled
- ✅ ESM interop enabled
- ✅ Type checking enabled

**Recommendation:**
Consider adding:
```json
{
  "compilerOptions": {
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

## Positive Security Practices Found

✅ **Good Practices:**
1. **No external network requests** - Fully offline operation
2. **No file system writes** - Read-only extension
3. **No command execution** - No shell/process spawning
4. **Deterministic behavior** - No randomness or state
5. **Input validation** - GUID format is validated before processing
6. **Minimal permissions** - No special VS Code API permissions required
7. **TypeScript strict mode** - Type safety enforced
8. **Bundling with esbuild** - Reduces attack surface by bundling dependencies
9. **No telemetry** - Privacy-respecting
10. **Open source** - Auditable code

---

## Attack Surface Analysis

### Trust Boundaries
1. **User Input → GUID Detection**
   - Risk: Low (validated regex)
   - Control: Pattern matching with bounded complexity

2. **GUID → Avatar Generation**
   - Risk: Medium (third-party library)
   - Control: Deterministic seed-based generation

3. **Avatar SVG → Markdown Display**
   - Risk: HIGH (HTML enabled, trusted mode)
   - Control: ⚠️ INSUFFICIENT

### Threat Model

**Threat 1: Malicious Workspace**
- A malicious codebase includes specially-crafted "GUIDs" designed to exploit the extension
- **Current Protection:** Regex validation
- **Risk Level:** LOW

**Threat 2: Compromised Dependencies**
- @dicebear or jdenticon packages contain malicious code
- **Current Protection:** None
- **Risk Level:** MEDIUM
- **Mitigation:** Use npm audit, Dependabot, lock files

**Threat 3: XSS via SVG Injection**
- SVG contains malicious JavaScript executed in VS Code's webview context
- **Current Protection:** ⚠️ INSUFFICIENT
- **Risk Level:** HIGH (if SVG sanitization is bypassed)

**Threat 4: DoS via Regex**
- Extremely large files cause performance degradation
- **Current Protection:** Efficient regex, but no input limits
- **Risk Level:** LOW

---

## Compliance & Standards

### VS Code Extension Guidelines
- ✅ Single responsibility - Does one thing well
- ✅ Performance - Efficient regex and caching via determinism
- ❌ Security - HTML trusted mode is concerning
- ✅ Privacy - No telemetry or data collection
- ⚠️ Documentation - Could be improved with security policy

### Marketplace Publishing Requirements
- ✅ Package.json metadata mostly complete
- ⚠️ Missing: bugs URL, homepage, keywords
- ⚠️ Missing: LICENSE file
- ✅ Icon provided
- ✅ README with screenshots

---

## Recommendations Summary

### Immediate Actions (Required)
1. **🔴 FIX CRITICAL:** Remove `isTrusted: true` and `supportHtml: true` or implement SVG sanitization
2. **🟡 FIX:** Downgrade mocha to 11.3.0 to resolve dependency vulnerability
3. **🟡 ADD:** Create LICENSE file (MIT as specified in package.json)
4. **🟡 ADD:** Add bugs URL and homepage to package.json

### Short-term (Recommended)
5. Remove or replace console.log statements
6. Narrow hover provider scheme/language selector
7. Add comprehensive unit tests
8. Add security policy (SECURITY.md)
9. Add keywords to package.json for discoverability

### Long-term (Suggested)
10. Consider input length validation for performance
11. Add ReDoS protection (match count limits)
12. Set up Dependabot for automated security updates
13. Add CI/CD with automated security scanning
14. Document threat model and security considerations

---

## Conclusion

The GUID Visual Overlay extension is a well-designed, focused tool with minimal attack surface. However, the **critical security issue** of marking markdown as trusted with HTML enabled must be addressed before wider distribution.

The extension follows many security best practices (offline operation, no file writes, type safety), but the HTML injection vector is a significant concern that could be exploited if the codebase evolves or if vulnerabilities exist in dependencies.

**Recommendation:** Address the critical markdown trust issue before next release.

---

## Appendix: Testing Recommendations

### Security Test Cases
1. Test with malicious SVG containing `<script>` tags
2. Test with GUIDs containing special characters/escape sequences
3. Test with extremely long lines (>1MB)
4. Test with files containing thousands of GUIDs
5. Test with malformed/partial GUID patterns
6. Test in untrusted workspaces
7. Test with remote files (SSH, WSL, Containers)

### Fuzzing Targets
- GUID regex pattern matching
- Avatar generation with random seeds
- SVG parsing and rendering

---

**End of Report**
