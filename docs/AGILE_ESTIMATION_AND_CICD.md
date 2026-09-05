# Agile Estimation, Burndown & CI/CD Pipeline
**Owner:** GURUBELLI YEKAMBAR ESHWAR RAO (PES2UG24CS173) — Full-Stack & QA/DevOps Lead

## Features Implemented:
1. **Fibonacci Story Point Scale:**
   - Allowed values: `1, 2, 3, 5, 8, 13, 21`.
   - Reflects non-linear complexity and prevents estimation anchoring.
2. **Sprint Capacity & Burndown Analytics:**
   - Velocity tracking: `(Completed Story Points / Total Sprint Points) * 100`.
   - Dynamic SVG visualizer comparing ideal burndown line against actual burn rate.
3. **Vitest Automated Test Suite:**
   - Unit tests for metric calculations, workload balance, and enum consistency.
4. **GitHub Actions CI Pipeline (`.github/workflows/ci.yml`):**
   - Automated triggers on all branch pushes and pull requests.
   - Build validation, Vitest test suite, linting, and security audits.
