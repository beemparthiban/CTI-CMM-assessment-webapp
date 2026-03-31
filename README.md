# CTI-CMM Assessment Tool

A web-based assessment tool for the **Cyber Threat Intelligence Capability Maturity Model (CTI-CMM) v1.3**. Evaluate your organization's CTI maturity across 11 domains and 197 objectives with an interactive, self-hosted application.

**Live Demo:** [beemparthiban.github.io/CTI-CMM-assessment-webapp](https://beemparthiban.github.io/CTI-CMM-assessment-webapp/)

## Features

- **11 CTI-CMM Domains** — Asset Management, Threat Landscape, Risk Management, Access Management, Situational Awareness, Incident Response, Third-Party Management, Fraud Management, Workforce Management, Architecture & Technology, Program Management
- **Maturity Scoring** — Rate each objective from 0 (Not Performed) to 3 (Optimized) across three maturity tiers
- **Dashboard** — Radar chart, bar chart, and domain summary cards showing overall maturity posture
- **Priority Planning** — Set target scores, impact, level of effort, target dates, and auto-calculated priority rankings (P1–P4)
- **Collapsible Sections** — Expand/collapse objective groups within each domain
- **Export / Import** — Save and load assessments as JSON files
- **Auto-Save** — All data persists in browser localStorage
- **Fully Client-Side** — No backend, no data leaves your browser

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Recharts (charts)
- React Router v7
- Lucide React (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Production Build

```bash
npm run build
npm run preview
```

## Docker

```bash
docker build -t cti-cmm-webapp .
docker run -p 3000:80 cti-cmm-webapp
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

This project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys to GitHub Pages on every push to `main`.

## About CTI-CMM

The [Cyber Threat Intelligence Capability Maturity Model (CTI-CMM)](https://cti-cmm.org/) is a community-driven framework that helps organizations assess and improve their cyber threat intelligence capabilities. This tool is based on CTI-CMM v1.3.

## License

This project is provided as-is for educational and assessment purposes.
