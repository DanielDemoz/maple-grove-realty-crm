# Maple Grove Realty — Lead CRM Prototype

A front-end demonstration of a residential real estate lead capture and CRM pipeline. Built for BRUKD Consultancy case studies — it looks and behaves like a real product but uses **entirely fictional sample data**. No real names, brokerages, phone numbers, or addresses appear anywhere in this project.

## What it does

- **Lead Form** — Capture prospect details with inline validation. New leads are scored automatically and saved to the pipeline.
- **CRM Dashboard** — Kanban-style pipeline (New → Contacted → Showing → Offer → Closed), filterable lead board, stat summary, and a detail drawer for notes and stage management.
- **Persistence** — Changes are stored in `localStorage` so they survive page refreshes. Use **Reset demo data** to restore the original 10 sample leads.

## How to run

No install, no build step, no server required.

1. Clone or download this repository.
2. Open `index.html` in any modern browser (double-click works).

For the hosted demo, visit the GitHub Pages URL once deployed.

## Tech stack

- Plain HTML, CSS, and vanilla JavaScript
- Google Fonts (Inter) loaded from CDN
- `localStorage` for client-side persistence
- No frameworks, no npm, no bundler

## Disclaimer

This is a **de-identified demonstration artifact** created by BRUKD Consultancy. All contact information and lead data are fictional. It is not connected to any live CRM, database, or brokerage system.

## About BRUKD

This prototype represents the kind of lead-to-CRM workflow BRUKD builds for residential real estate clients — from intake forms and lead scoring through pipeline management, delivered as lightweight, deployable web tools.
