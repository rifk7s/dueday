# RTK — Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:              Use:
git status                 rtk git status
git log -10                rtk git log -10
cargo test                 rtk cargo test
docker ps                  rtk docker ps
kubectl get pods           rtk kubectl pods
```

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```

---

## Skill Discovery

**Required workflow before making ANY changes:**

1. Identify package: `dueday-be/` or `dueday-fe/`
2. Load package AGENTS.md
3. List skills: `ls -la [package]/.agents/skills/`
4. Check for matching skill → Load if exists
5. Execute

**Backend skills**: laravel-best-practices, pest-testing, tailwindcss-development  
**Frontend skills**: See `dueday-fe/AGENTS.md`

See `/AGENTS.md` for full routing.
