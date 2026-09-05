# Agile Estimation, Burndown Analytics, and CI/CD Automation

**Module Owner:** GURUBELLI YEKAMBAR ESHWAR RAO (PES2UG24CS173) — Full-Stack and QA/DevOps Lead  
**Component Reference:** `src/utils/estimation.js`, `src/components/sprint/`, `.github/workflows/ci.yml`  

---

## 1. Agile Estimation Architecture
The system enforces the Fibonacci sequence for story point attribution:
`Allowed Values: 1, 2, 3, 5, 8, 13, 21`

### Mathematical Formulations:
- **Sprint Capacity:** $\sum 	ext{Story Points of all tasks in sprint}$
- **Delivered Velocity:** $\sum 	ext{Story Points of tasks with status 'done'}$
- **Progress Percentage:** $\left(rac{	ext{Delivered Velocity}}{	ext{Sprint Capacity}}ight) 	imes 100$

---

## 2. Burndown Curve Generation
The burndown visualizer plots daily remaining points against an ideal linear consumption rate:
- **Ideal Trajectory:** Linear decrease from total capacity to zero across the iteration duration.
- **Actual Velocity:** Point burn rate computed daily based on verified task completion events.

---

## 3. Continuous Integration Pipeline (`.github/workflows/ci.yml`)
Automated verification pipeline executed on cloud Ubuntu virtual machines:
1. **Build Job:** Dependency caching, environment setup (Node.js 20), and production bundle compilation.
2. **Test Job:** Execution of automated Vitest unit test suites.
3. **Lint Job:** Verification of syntax integrity and architectural consistency.
4. **Security Job:** Automated vulnerability audit via `npm audit`.
