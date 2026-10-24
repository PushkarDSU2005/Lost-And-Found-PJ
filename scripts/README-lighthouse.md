# Lighthouse Audit Scripts - Task 16b

## Prerequisites

Install Lighthouse CLI globally:

```bash
npm install -g lighthouse
# or
pnpm add -g lighthouse
```

## Usage

### 1. Start Production Build

```bash
pnpm build
pnpm start
```

The app will run on `http://localhost:3000`

### 2. Run Lighthouse Audits

**Windows (PowerShell)**:
```powershell
.\scripts\lighthouse-audit.ps1
```

**Options**:
```powershell
# Audit production site
.\scripts\lighthouse-audit.ps1 -BaseUrl "https://your-domain.com"

# Only performance category (faster)
.\scripts\lighthouse-audit.ps1 -OnlyPerformance
```

**Linux/Mac (Bash)**:
```bash
chmod +x scripts/lighthouse-audit.sh
./scripts/lighthouse-audit.sh
```

### 3. View Reports

Reports are saved to `lighthouse-reports/`:
- HTML: Open in browser for detailed analysis
- JSON: For programmatic analysis

**Example**:
```powershell
# Open Home page report
start lighthouse-reports\Home_2026-10-17_14-30-00.report.html
```

## Manual Audit (Chrome DevTools)

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select:
   - **Device**: Mobile
   - **Categories**: Performance (or all)
   - **Throttling**: Simulated 4G
4. Click "Analyze page load"

## Pages to Test

| Page | URL | Priority |
|------|-----|----------|
| **Home** | `/` | 🔴 HIGH |
| **Browse** | `/browse` | 🔴 HIGH |
| **Item Detail** | `/items/<item-id>` | 🟡 MEDIUM |
| Browse (Lost) | `/browse?type=lost` | 🟢 LOW |
| Browse (Found) | `/browse?type=found` | 🟢 LOW |

## Target Metrics (Task 16b)

| Metric | Target | Weight |
|--------|--------|--------|
| **Performance Score** | ≥90 | 🔴 CRITICAL |
| LCP | <2.5s | HIGH |
| CLS | <0.1 | HIGH |
| TBT | <200ms | MEDIUM |
| FCP | <1.8s | MEDIUM |
| TTI | <3.8s | MEDIUM |

## Interpreting Results

### Performance Score Breakdown
- **90-100**: 🟢 Excellent
- **50-89**: 🟡 Needs improvement
- **0-49**: 🔴 Poor

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| High LCP | ✅ Already fixed: next/image + priority prop |
| High CLS | ✅ Already fixed: explicit image dimensions |
| Large bundle | ✅ Already fixed: dynamic imports |
| Slow TTFB | ✅ Already fixed: DB indexes + caching |
| Unoptimized images | ✅ Already fixed: WebP/AVIF formats |

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
```

See `.lighthouserc.js` for config (create if needed).

## Troubleshooting

**Error: "lighthouse: command not found"**
```bash
npm install -g lighthouse
```

**Error: "Unable to load page"**
- Check if server is running: `curl http://localhost:3000`
- Check firewall/antivirus blocking Chrome

**Low scores despite optimizations**
- Clear browser cache
- Use Incognito mode
- Check network throttling settings
- Verify production build (not dev mode)
