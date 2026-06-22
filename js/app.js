/**
 * app.js — Application state, rendering, and event handling.
 *
 * State flow:
 *   1. loadLeads() on init → populate `leads` array
 *   2. User actions (form submit, filter, stage move, notes edit) mutate `leads`
 *   3. saveLeads(leads) persists after every mutation
 *   4. render* functions rebuild DOM from current state (no virtual DOM)
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────
  let leads = loadLeads();
  let activeView = 'form';
  let filters = { stage: '', intent: '', area: '', search: '' };
  let selectedLeadId = null;

  // ── DOM refs ───────────────────────────────────────────────────────────
  const viewForm = document.getElementById('view-form');
  const viewCrm = document.getElementById('view-crm');
  const navForm = document.getElementById('nav-form');
  const navCrm = document.getElementById('nav-crm');

  // ── View switching ─────────────────────────────────────────────────────
  function switchView(view) {
    activeView = view;
    navForm.classList.toggle('active', view === 'form');
    navCrm.classList.toggle('active', view === 'crm');

    viewForm.classList.toggle('view-active', view === 'form');
    viewCrm.classList.toggle('view-active', view === 'crm');
    viewForm.hidden = view !== 'form';
    viewCrm.hidden = view !== 'crm';

    if (view === 'form') renderFormView();
    if (view === 'crm') renderCrmView();
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  function generateId() {
    return 'lead-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getFilteredLeads() {
    return leads.filter(function (lead) {
      if (filters.stage && lead.stage !== filters.stage) return false;
      if (filters.intent && lead.intent !== filters.intent) return false;
      if (filters.area && lead.area !== filters.area) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!lead.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  function leadsNewInLast7Days() {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return leads.filter(function (l) {
      return new Date(l.createdAt).getTime() >= cutoff;
    }).length;
  }

  function countHotLeads() {
    return leads.filter(function (l) {
      return scoreTier(scoreLead(l)) === 'Hot';
    }).length;
  }

  function countByStage() {
    const counts = {};
    STAGES.forEach(function (s) { counts[s] = 0; });
    leads.forEach(function (l) {
      if (counts[l.stage] !== undefined) counts[l.stage]++;
    });
    return counts;
  }

  function tierClass(tier) {
    if (tier === 'Hot') return 'tier-hot';
    if (tier === 'Warm') return 'tier-warm';
    return 'tier-cold';
  }

  function getLeadById(id) {
    return leads.find(function (l) { return l.id === id; });
  }

  function moveLeadStage(id, direction) {
    const lead = getLeadById(id);
    if (!lead) return;
    const idx = STAGES.indexOf(lead.stage);
    const newIdx = direction === 'forward' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= STAGES.length) return;
    lead.stage = STAGES[newIdx];
    saveLeads(leads);
    renderCrmView();
  }

  // ── Lead Form view ───────────────────────────────────────────────────────
  function renderFormView() {
    viewForm.innerHTML =
      '<div class="form-container">' +
        '<h2 class="view-title">Capture a New Lead</h2>' +
        '<p class="view-subtitle">Enter prospect details below. Leads are scored automatically and appear in the CRM pipeline.</p>' +
        '<div id="form-success" class="banner banner-success" hidden>Lead captured. View it in the CRM.</div>' +
        '<div class="lead-form" id="lead-form" novalidate>' +
          fieldHtml('name', 'Full Name', 'text', true) +
          fieldHtml('email', 'Email', 'email', true) +
          fieldHtml('phone', 'Phone', 'tel', true) +
          selectHtml('intent', 'Intent', INTENTS, true) +
          selectHtml('budget', 'Budget', BUDGET_TIERS, true) +
          selectHtml('area', 'Preferred Area', AREAS, true) +
          selectHtml('timeline', 'Timeline', TIMELINES, true) +
          '<div class="form-field">' +
            '<label for="field-message">Message</label>' +
            '<textarea id="field-message" name="message" rows="4" placeholder="Tell us what you are looking for…"></textarea>' +
            '<span class="field-error" id="error-message"></span>' +
          '</div>' +
          '<button type="button" class="btn btn-primary" id="btn-submit-lead">Submit Lead</button>' +
        '</div>' +
      '</div>';

    document.getElementById('btn-submit-lead').addEventListener('click', handleFormSubmit);
  }

  function fieldHtml(name, label, type, required) {
    return (
      '<div class="form-field">' +
        '<label for="field-' + name + '">' + label + (required ? ' <span class="required">*</span>' : '') + '</label>' +
        '<input type="' + type + '" id="field-' + name + '" name="' + name + '"' +
          (required ? ' required' : '') + ' autocomplete="off">' +
        '<span class="field-error" id="error-' + name + '"></span>' +
      '</div>'
    );
  }

  function selectHtml(name, label, options, required) {
    let opts = '<option value="">Select…</option>';
    options.forEach(function (o) {
      opts += '<option value="' + escapeHtml(o) + '">' + escapeHtml(o) + '</option>';
    });
    return (
      '<div class="form-field">' +
        '<label for="field-' + name + '">' + label + (required ? ' <span class="required">*</span>' : '') + '</label>' +
        '<select id="field-' + name + '" name="' + name + '"' + (required ? ' required' : '') + '>' +
          opts +
        '</select>' +
        '<span class="field-error" id="error-' + name + '"></span>' +
      '</div>'
    );
  }

  function clearFormErrors() {
    viewForm.querySelectorAll('.field-error').forEach(function (el) {
      el.textContent = '';
    });
    viewForm.querySelectorAll('.form-field').forEach(function (el) {
      el.classList.remove('has-error');
    });
  }

  function setFieldError(name, message) {
    const errEl = document.getElementById('error-' + name);
    const fieldEl = document.getElementById('field-' + name);
    if (errEl) errEl.textContent = message;
    if (fieldEl) fieldEl.closest('.form-field').classList.add('has-error');
  }

  function handleFormSubmit() {
    clearFormErrors();
    const successBanner = document.getElementById('form-success');
    if (successBanner) successBanner.hidden = true;

    const name = document.getElementById('field-name').value.trim();
    const email = document.getElementById('field-email').value.trim();
    const phone = document.getElementById('field-phone').value.trim();
    const intent = document.getElementById('field-intent').value;
    const budget = document.getElementById('field-budget').value;
    const area = document.getElementById('field-area').value;
    const timeline = document.getElementById('field-timeline').value;
    const message = document.getElementById('field-message').value.trim();

    let valid = true;

    if (!name) { setFieldError('name', 'Name is required.'); valid = false; }
    if (!email) {
      setFieldError('email', 'Email is required.'); valid = false;
    } else if (!isValidEmail(email)) {
      setFieldError('email', 'Enter a valid email address.'); valid = false;
    }
    if (!phone) { setFieldError('phone', 'Phone is required.'); valid = false; }
    if (!intent) { setFieldError('intent', 'Please select an intent.'); valid = false; }
    if (!budget) { setFieldError('budget', 'Please select a budget.'); valid = false; }
    if (!area) { setFieldError('area', 'Please select an area.'); valid = false; }
    if (!timeline) { setFieldError('timeline', 'Please select a timeline.'); valid = false; }

    if (!valid) return;

    const newLead = {
      id: generateId(),
      name: name,
      email: email,
      phone: phone,
      intent: intent,
      budget: budget,
      area: area,
      timeline: timeline,
      message: message,
      stage: 'New',
      notes: '',
      createdAt: new Date().toISOString()
    };

    // Score is computed at render time via scoreLead(); stored object needs no score field.
    leads.unshift(newLead);
    saveLeads(leads);

    // Reset form fields
    ['name', 'email', 'phone', 'message'].forEach(function (f) {
      document.getElementById('field-' + f).value = '';
    });
    ['intent', 'budget', 'area', 'timeline'].forEach(function (f) {
      document.getElementById('field-' + f).value = '';
    });

    if (successBanner) successBanner.hidden = false;
  }

  // ── CRM Dashboard view ───────────────────────────────────────────────────
  function renderCrmView() {
    // Preserve search input focus/cursor across live re-renders while typing
    const prevSearch = document.getElementById('filter-search');
    const searchHadFocus = prevSearch && document.activeElement === prevSearch;
    const searchCursor = searchHadFocus ? prevSearch.selectionStart : 0;

    const filtered = getFilteredLeads();
    const stageCounts = countByStage();

    // Summary stat cards
    let stageBreakdown = '';
    STAGES.forEach(function (s) {
      stageBreakdown +=
        '<span class="stage-pill">' + escapeHtml(s) + ': <strong>' + stageCounts[s] + '</strong></span>';
    });

    viewCrm.innerHTML =
      '<div class="crm-container">' +
        '<div class="crm-header">' +
          '<h2 class="view-title">CRM Dashboard</h2>' +
          '<button type="button" class="btn btn-outline" id="btn-reset">Reset demo data</button>' +
        '</div>' +

        '<div class="stats-row">' +
          statCard('Total Leads', leads.length) +
          statCard('New (7 days)', leadsNewInLast7Days()) +
          statCard('Hot Leads', countHotLeads()) +
          '<div class="stat-card stat-card-wide">' +
            '<span class="stat-label">Pipeline Breakdown</span>' +
            '<div class="stage-breakdown">' + stageBreakdown + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="filter-bar">' +
          filterSelect('filter-stage', 'Stage', [''].concat(STAGES), filters.stage) +
          filterSelect('filter-intent', 'Intent', [''].concat(INTENTS), filters.intent) +
          filterSelect('filter-area', 'Area', [''].concat(AREAS), filters.area) +
          '<div class="filter-field">' +
            '<label for="filter-search">Search</label>' +
            '<input type="search" id="filter-search" placeholder="Search by name…" value="' + escapeHtml(filters.search) + '">' +
          '</div>' +
        '</div>' +

        '<div class="pipeline" id="pipeline">' + renderPipeline(filtered) + '</div>' +
      '</div>' +
      '<div class="drawer-overlay" id="drawer-overlay" hidden></div>' +
      '<aside class="detail-drawer" id="detail-drawer" hidden aria-label="Lead detail"></aside>';

    bindCrmEvents();

    if (searchHadFocus) {
      const newSearch = document.getElementById('filter-search');
      newSearch.focus();
      newSearch.setSelectionRange(searchCursor, searchCursor);
    }

    if (selectedLeadId) openDetailDrawer(selectedLeadId);
  }

  function statCard(label, value) {
    return (
      '<div class="stat-card">' +
        '<span class="stat-label">' + escapeHtml(label) + '</span>' +
        '<span class="stat-value">' + value + '</span>' +
      '</div>'
    );
  }

  function filterSelect(id, label, options, current) {
    let opts = '';
    options.forEach(function (o) {
      const display = o === '' ? 'All' : o;
      const selected = o === current ? ' selected' : '';
      opts += '<option value="' + escapeHtml(o) + '"' + selected + '>' + escapeHtml(display) + '</option>';
    });
    return (
      '<div class="filter-field">' +
        '<label for="' + id + '">' + label + '</label>' +
        '<select id="' + id + '">' + opts + '</select>' +
      '</div>'
    );
  }

  function renderPipeline(filteredLeads) {
    let html = '';
    STAGES.forEach(function (stage) {
      const columnLeads = filteredLeads.filter(function (l) { return l.stage === stage; });
      html +=
        '<div class="pipeline-column" data-stage="' + escapeHtml(stage) + '">' +
          '<div class="column-header">' +
            '<h3>' + escapeHtml(stage) + '</h3>' +
            '<span class="column-count">' + columnLeads.length + '</span>' +
          '</div>' +
          '<div class="column-cards">' +
            (columnLeads.length
              ? columnLeads.map(renderLeadCard).join('')
              : '<p class="column-empty">No leads</p>') +
          '</div>' +
        '</div>';
    });
    return html;
  }

  function renderLeadCard(lead) {
    const score = scoreLead(lead);
    const tier = scoreTier(score);
    return (
      '<article class="lead-card" data-id="' + escapeHtml(lead.id) + '" tabindex="0" role="button">' +
        '<div class="card-top">' +
          '<span class="card-name">' + escapeHtml(lead.name) + '</span>' +
          '<span class="tier-badge ' + tierClass(tier) + '">' + tier + ' · ' + score + '</span>' +
        '</div>' +
        '<div class="card-meta">' +
          '<span>' + escapeHtml(lead.intent) + '</span>' +
          '<span>' + escapeHtml(lead.budget) + '</span>' +
        '</div>' +
        '<div class="card-meta">' +
          '<span>' + escapeHtml(lead.area) + '</span>' +
          '<span>' + escapeHtml(lead.timeline) + '</span>' +
        '</div>' +
      '</article>'
    );
  }

  function bindCrmEvents() {
    document.getElementById('btn-reset').addEventListener('click', function () {
      leads = resetLeads();
      filters = { stage: '', intent: '', area: '', search: '' };
      selectedLeadId = null;
      renderCrmView();
    });

    document.getElementById('filter-stage').addEventListener('change', function (e) {
      filters.stage = e.target.value;
      renderCrmView();
    });
    document.getElementById('filter-intent').addEventListener('change', function (e) {
      filters.intent = e.target.value;
      renderCrmView();
    });
    document.getElementById('filter-area').addEventListener('change', function (e) {
      filters.area = e.target.value;
      renderCrmView();
    });
    document.getElementById('filter-search').addEventListener('input', function (e) {
      filters.search = e.target.value;
      renderCrmView();
    });

    document.querySelectorAll('.lead-card').forEach(function (card) {
      card.addEventListener('click', function () {
        openDetailDrawer(card.dataset.id);
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetailDrawer(card.dataset.id);
        }
      });
    });
  }

  function openDetailDrawer(id) {
    selectedLeadId = id;
    const lead = getLeadById(id);
    if (!lead) return;

    const score = scoreLead(lead);
    const tier = scoreTier(score);
    const stageIdx = STAGES.indexOf(lead.stage);

    const drawer = document.getElementById('detail-drawer');
    const overlay = document.getElementById('drawer-overlay');

    drawer.innerHTML =
      '<div class="drawer-header">' +
        '<h3>' + escapeHtml(lead.name) + '</h3>' +
        '<button type="button" class="btn-icon" id="btn-close-drawer" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="drawer-body">' +
        '<div class="drawer-score">' +
          '<span class="tier-badge ' + tierClass(tier) + '">' + tier + '</span>' +
          '<span class="score-num">Score: ' + score + '/100</span>' +
        '</div>' +
        detailRow('Email', lead.email) +
        detailRow('Phone', lead.phone) +
        detailRow('Intent', lead.intent) +
        detailRow('Budget', lead.budget) +
        detailRow('Area', lead.area) +
        detailRow('Timeline', lead.timeline) +
        detailRow('Stage', lead.stage) +
        detailRow('Created', new Date(lead.createdAt).toLocaleDateString('en-CA', {
          year: 'numeric', month: 'short', day: 'numeric'
        })) +
        (lead.message
          ? '<div class="detail-field"><span class="detail-label">Message</span><p class="detail-text">' + escapeHtml(lead.message) + '</p></div>'
          : '') +
        '<div class="detail-field">' +
          '<label class="detail-label" for="drawer-notes">Notes</label>' +
          '<textarea id="drawer-notes" rows="4" placeholder="Add internal notes…">' + escapeHtml(lead.notes) + '</textarea>' +
        '</div>' +
        '<div class="drawer-actions">' +
          '<button type="button" class="btn btn-outline" id="btn-move-back"' +
            (stageIdx <= 0 ? ' disabled' : '') + '>Move back</button>' +
          '<button type="button" class="btn btn-primary" id="btn-move-forward"' +
            (stageIdx >= STAGES.length - 1 ? ' disabled' : '') + '>Move forward</button>' +
        '</div>' +
      '</div>';

    drawer.hidden = false;
    overlay.hidden = false;

    document.getElementById('btn-close-drawer').addEventListener('click', closeDetailDrawer);
    overlay.addEventListener('click', closeDetailDrawer);

    document.getElementById('drawer-notes').addEventListener('change', function (e) {
      lead.notes = e.target.value;
      saveLeads(leads);
    });

    document.getElementById('btn-move-back').addEventListener('click', function () {
      moveLeadStage(id, 'back');
    });
    document.getElementById('btn-move-forward').addEventListener('click', function () {
      moveLeadStage(id, 'forward');
    });
  }

  function detailRow(label, value) {
    return (
      '<div class="detail-field">' +
        '<span class="detail-label">' + escapeHtml(label) + '</span>' +
        '<span class="detail-value">' + escapeHtml(value) + '</span>' +
      '</div>'
    );
  }

  function closeDetailDrawer() {
    selectedLeadId = null;
    const drawer = document.getElementById('detail-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer) drawer.hidden = true;
    if (overlay) overlay.hidden = true;
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  navForm.addEventListener('click', function () { switchView('form'); });
  navCrm.addEventListener('click', function () { switchView('crm'); });

  switchView('form');
})();
