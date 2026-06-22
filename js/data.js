/**
 * data.js — Seed lead data and localStorage persistence helpers.
 * All names, contact details, and addresses are entirely fictional.
 */

const STORAGE_KEY = 'mgr_crm_leads';

/** Budget tier options used in forms and seed data (lowest → highest). */
const BUDGET_TIERS = [
  'Under $500K',
  '$500K – $750K',
  '$750K – $1M',
  '$1M – $1.5M',
  '$1.5M+'
];

const AREAS = ['Mississauga', 'Brampton', 'Vaughan', 'Markham', 'Toronto'];
const TIMELINES = ['ASAP', '1-3 months', '3-6 months', 'Just browsing'];
const INTENTS = ['Buying', 'Selling', 'Investing'];
const STAGES = ['New', 'Contacted', 'Showing', 'Offer', 'Closed'];

/**
 * Original demo dataset — 10 fictional leads spread across all five pipeline stages.
 * createdAt values fall within the last three weeks relative to demo build date.
 */
const SEED_LEADS = [
  {
    id: 'lead-001',
    name: 'Avery Chen',
    email: 'avery.chen@example-mail.demo',
    phone: '(555) 201-4401',
    intent: 'Buying',
    budget: '$750K – $1M',
    area: 'Mississauga',
    timeline: 'ASAP',
    message: 'Looking for a detached home near the lake with a finished basement.',
    stage: 'New',
    notes: '',
    createdAt: '2026-06-18T14:22:00.000Z'
  },
  {
    id: 'lead-002',
    name: 'Jordan Blake',
    email: 'j.blake@demo-inbox.test',
    phone: '(555) 318-7720',
    intent: 'Selling',
    budget: '$500K – $750K',
    area: 'Brampton',
    timeline: '1-3 months',
    message: 'Need a market evaluation for our semi-detached in the north end.',
    stage: 'New',
    notes: 'Prefers evening calls after 6 PM.',
    createdAt: '2026-06-15T09:10:00.000Z'
  },
  {
    id: 'lead-003',
    name: 'Riley Nakamura',
    email: 'rnakamura@samplebox.demo',
    phone: '(555) 402-1198',
    intent: 'Investing',
    budget: '$1M – $1.5M',
    area: 'Toronto',
    timeline: '1-3 months',
    message: 'Interested in duplex or triplex properties with positive cash flow.',
    stage: 'Contacted',
    notes: 'Sent intro package. Follow up Thursday.',
    createdAt: '2026-06-10T16:45:00.000Z'
  },
  {
    id: 'lead-004',
    name: 'Morgan Ellis',
    email: 'morgan.ellis@fictional-mail.demo',
    phone: '(555) 509-8834',
    intent: 'Buying',
    budget: '$1.5M+',
    area: 'Markham',
    timeline: 'ASAP',
    message: 'Relocating from out of province. Need a 4-bed in a top school district.',
    stage: 'Contacted',
    notes: 'Pre-approval letter received.',
    createdAt: '2026-06-08T11:30:00.000Z'
  },
  {
    id: 'lead-005',
    name: 'Casey Okafor',
    email: 'c.okafor@demo-leads.test',
    phone: '(555) 614-2205',
    intent: 'Buying',
    budget: '$500K – $750K',
    area: 'Vaughan',
    timeline: '3-6 months',
    message: 'First-time buyer exploring condos near transit.',
    stage: 'Showing',
    notes: 'Scheduled two showings for next weekend.',
    createdAt: '2026-06-05T13:00:00.000Z'
  },
  {
    id: 'lead-006',
    name: 'Taylor Singh',
    email: 't.singh@example-crm.demo',
    phone: '(555) 720-4412',
    intent: 'Selling',
    budget: '$750K – $1M',
    area: 'Mississauga',
    timeline: '1-3 months',
    message: 'Downsizing after kids moved out. Townhouse in Erin Mills area.',
    stage: 'Showing',
    notes: 'Staging consult booked.',
    createdAt: '2026-06-02T10:15:00.000Z'
  },
  {
    id: 'lead-007',
    name: 'Quinn Hartley',
    email: 'qhartley@sample-inbox.demo',
    phone: '(555) 831-5590',
    intent: 'Investing',
    budget: '$1.5M+',
    area: 'Toronto',
    timeline: 'ASAP',
    message: 'Portfolio expansion — looking at mixed-use commercial-residential.',
    stage: 'Offer',
    notes: 'Offer submitted on Bayview property. Awaiting counter.',
    createdAt: '2026-05-28T15:40:00.000Z'
  },
  {
    id: 'lead-008',
    name: 'Drew Fontaine',
    email: 'drew.f@demo-mailbox.test',
    phone: '(555) 942-6671',
    intent: 'Buying',
    budget: '$1M – $1.5M',
    area: 'Markham',
    timeline: '1-3 months',
    message: 'Want a newer build with home office space.',
    stage: 'Offer',
    notes: 'Inspection scheduled for Tuesday.',
    createdAt: '2026-05-25T08:50:00.000Z'
  },
  {
    id: 'lead-009',
    name: 'Sage Whitmore',
    email: 's.whitmore@fictional-crm.demo',
    phone: '(555) 103-7782',
    intent: 'Selling',
    budget: '$750K – $1M',
    area: 'Brampton',
    timeline: '3-6 months',
    message: 'Listing our bungalow — flexible on closing date.',
    stage: 'Closed',
    notes: 'Closed June 1. Client very satisfied.',
    createdAt: '2026-05-20T12:00:00.000Z'
  },
  {
    id: 'lead-010',
    name: 'Harper Lindqvist',
    email: 'harper.l@demo-contacts.test',
    phone: '(555) 214-8893',
    intent: 'Buying',
    budget: 'Under $500K',
    area: 'Vaughan',
    timeline: 'Just browsing',
    message: 'Early research phase — not ready to commit yet.',
    stage: 'Closed',
    notes: 'Added to nurture email list.',
    createdAt: '2026-05-18T17:25:00.000Z'
  }
];

/**
 * Load leads from localStorage, or return a deep copy of the seed data.
 */
function loadLeads() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not read leads from localStorage:', e);
  }
  return JSON.parse(JSON.stringify(SEED_LEADS));
}

/**
 * Persist the current leads array to localStorage.
 */
function saveLeads(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/**
 * Remove stored data and return a fresh copy of the seed dataset.
 */
function resetLeads() {
  localStorage.removeItem(STORAGE_KEY);
  return JSON.parse(JSON.stringify(SEED_LEADS));
}
