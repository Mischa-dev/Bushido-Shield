
# Bushido Shield — Style Guide (Modern UI)
_Version 2025-10-18 · Owner: Mischa Nelson_

![Bushido Shield](/mnt/data/bushido_shield_logo.svg)

This Markdown is meant for Copilot to **learn** our look-and-feel. It defines tokens, components, and code snippets for our **extension options page** and **localhost dashboard**. The vibe is **fresh, rounded, family‑friendly**, and aligned with the Bushido Shield marketing site.

---

## 0) Quick Brand Snapshot
- **Primary:** `#DC2626` (brand red)  
- **Ink (text):** `#0F172A` (navy)  
- **Info tint:** `#CFFAFE` (light blue)  
- **Alert tint:** `#FEE2E2` (light red)
- **Corners:** cards 16px; controls 10px; pills 999px  
- **Shadows:** soft depth, never harsh  
- **Font:** Inter (fallback system-ui)

---

## 1) Design Tokens (CSS Variables)
```css
:root{
  /* Brand & core */
  --brand:#DC2626;
  --ink:#0F172A;
  --t-info:#CFFAFE;
  --t-alert:#FEE2E2;

  /* Surface & borders */
  --bg:#F7FAFC;
  --panel:#FFFFFF;
  --border:rgba(15,23,42,.10);
  --border-strong:rgba(15,23,42,.18);

  /* Feedback */
  --success:#22C55E;
  --warning:#F59E0B;
  --info:#0EA5E9;
  --danger:#DC2626;

  /* Motion & effects */
  --shadow-1:0 2px 10px rgba(15,23,42,.06);
  --shadow-2:0 10px 30px rgba(15,23,42,.12);
  --ring:rgba(220,38,38,.28);
}

/* Optional dark theme baseline */
[data-theme="dark"]{
  --bg:#0B1220; --panel:#0F172A; --border:rgba(148,163,184,.20);
  --border-strong:rgba(148,163,184,.32); --ink:#E5E7EB;
}
```

**Typography**
```css
:root{ --font: "Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
.h1{font:700 28px/1.35 var(--font); color:var(--ink);}
.h2{font:600 22px/1.4 var(--font);}
.text{font:400 16px/1.6 var(--font); color:var(--ink);}
.label{font:500 14px/1 var(--font);}
.num{font-variant-numeric: tabular-nums;}
```

**Radii, Spacing, Motion**
```css
:root{ --r-card:16px; --r-ctl:10px; --r-pill:999px; }
:root{ --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:20px; --space-6:24px; --space-8:32px; }
:root{ --ease:cubic-bezier(.2,.8,.2,1); --dur:140ms; }
```

---

## 2) Layout Patterns
**Three‑pane grid** (desktop ≥1200px):
```
| Left Quick (300px) | Main (auto) | Right Details (360px) |
```
- Each pane scrolls independently; sticky mini headers inside each pane.
- Footer pinned inside container.

**Container**
```css
.app{max-width:1280px;margin:24px auto;padding:20px;background:var(--panel);
     border:1px solid var(--border); border-radius:var(--r-card); box-shadow:var(--shadow-2);}
.grid{display:grid; grid-template-columns:300px minmax(520px,1fr) 360px; gap:20px;}
```

---

## 3) Core Components (Modern, Accessible)

### 3.1 Buttons
```html
<button class="btn btn--primary">Pause 15m</button>
<button class="btn btn--secondary">Apply profile…</button>
<button class="btn btn--ghost">Open full dashboard</button>
```
```css
.btn{border-radius:var(--r-ctl); padding:.6rem .9rem; font:600 14px var(--font); transition:transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease);}
.btn:focus{outline:3px solid var(--ring); outline-offset:2px;}
.btn--primary{background:var(--brand); color:#fff; border:0;}
.btn--primary:hover{transform:translateY(-1px);}
.btn--secondary{background:#fff; color:var(--ink); border:1px solid var(--border);}
.btn--ghost{background:transparent; color:var(--ink);}
```

### 3.2 Tabs (Segmented Pills)
```html
<nav class="tabs" role="tablist">
  <button role="tab" aria-selected="true" class="tab is-active">Devices</button>
  <button role="tab" class="tab">Profiles</button>
  <button role="tab" class="tab">Routines</button>
</nav>
```
```css
.tab{border:1px solid var(--border); border-radius:var(--r-pill); padding:.5rem .9rem; background:#fff; color:var(--ink);}
.tab:hover{box-shadow:var(--shadow-1); transform:translateY(-1px);}
.tab.is-active{box-shadow:0 0 0 2px var(--brand) inset;
  background:color-mix(in srgb, #fff 92%, var(--brand) 8%);}
```

### 3.3 Modern Checkbox (with Indeterminate)
```html
<label class="cbx">
  <input type="checkbox" class="cbx__input" aria-label="Select row">
  <span class="cbx__box"></span>
</label>
```
```css
.cbx__input{appearance:none; width:0; height:0; position:absolute;}
.cbx__box{display:inline-block; width:18px; height:18px; border-radius:8px;
  border:1px solid var(--border); background:#fff; box-shadow:inset 0 1px 0 rgba(0,0,0,.04);
  transition:all var(--dur) var(--ease);}
.cbx__input:focus + .cbx__box{outline:3px solid var(--ring);}
.cbx__input:checked + .cbx__box{background:var(--brand); border-color:var(--brand);}
.cbx__input:checked + .cbx__box::after{content:""; display:block; width:10px; height:6px; border:2px solid #fff;
  border-top:none; border-right:none; transform:translate(3px,3px) rotate(-45deg);}
/* Indeterminate */
.cbx__input.indeterminate + .cbx__box{background:var(--brand); border-color:var(--brand);}
.cbx__input.indeterminate + .cbx__box::after{content:""; display:block; width:10px; height:2px; background:#fff; transform:translate(4px,7px);}
```

### 3.4 Radio (Pills)
```html
<label class="radio-pill"><input type="radio" name="strict" checked> <span>Medium</span></label>
<label class="radio-pill"><input type="radio" name="strict"> <span>High</span></label>
```
```css
.radio-pill input{position:absolute; opacity:0;}
.radio-pill{display:inline-block; padding:.35rem .7rem; border:1px solid var(--border); border-radius:var(--r-pill);
  font:500 14px var(--font); cursor:pointer;}
.radio-pill:hover{background:rgba(15,23,42,.04);}
.radio-pill:has(input:checked){background:color-mix(in srgb,#fff 90%, var(--brand) 10%); box-shadow:0 0 0 2px var(--brand) inset;}
```

### 3.5 Select — Two Patterns

**A) Styled Native Select (zero JS)**
```html
<div class="select">
  <select aria-label="Profile">
    <option>Default</option><option>School</option><option>Focus</option>
  </select>
</div>
```
```css
.select select{appearance:none; -webkit-appearance:none; background:#fff; color:var(--ink);
  border:1px solid var(--border); border-radius:var(--r-ctl); padding:.5rem 2rem .5rem .7rem; height:40px;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' fill='%230F172A' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.5 7.5l4.5 5 4.5-5'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right .6rem center; background-size:16px;}
.select select:focus{outline:3px solid var(--ring);}
```

**B) Combobox (Searchable Command Menu)**
```html
<div class="combo" role="combobox" aria-expanded="false" aria-owns="combo-list" aria-haspopup="listbox">
  <input class="combo__input" aria-autocomplete="list" aria-controls="combo-list" placeholder="Choose profile…" />
  <ul id="combo-list" class="combo__list" role="listbox">
    <li role="option" aria-selected="true">Default</li>
    <li role="option">School</li>
    <li role="option">Focus</li>
  </ul>
</div>
```
```css
.combo{position:relative; max-width:260px;}
.combo__input{width:100%; height:40px; border:1px solid var(--border); border-radius:var(--r-ctl); padding:.5rem .7rem;}
.combo__list{position:absolute; inset:auto 0 0 0; transform:translateY(6px); background:#fff; border:1px solid var(--border);
  border-radius:12px; box-shadow:var(--shadow-2); padding:6px; display:none; max-height:240px; overflow:auto;}
[aria-expanded="true"] > .combo__list{display:block;}
.combo__list [role="option"]{padding:.45rem .6rem; border-radius:8px; cursor:pointer;}
.combo__list [role="option"][aria-selected='true'], .combo__list [role="option"]:hover{
  background:color-mix(in srgb,#fff 90%, var(--brand) 10%);}
```

**Keyboard**
- `Enter` open/commit · `Esc` close · `↑/↓` move · `Home/End` jump.

### 3.6 Switch (Protection)
```html
<label class="sw">
  <input type="checkbox" role="switch" aria-label="Shield">
  <span class="sw__track"><span class="sw__thumb"></span></span>
</label>
```
```css
.sw input{position:absolute; opacity:0;}
.sw__track{width:42px; height:24px; background:rgba(15,23,42,.14); border-radius:var(--r-pill); position:relative;
  transition:background var(--dur) var(--ease);}
.sw__thumb{width:18px; height:18px; background:#fff; border-radius:50%; position:absolute; top:3px; left:3px;
  box-shadow:var(--shadow-1); transition:transform var(--dur) var(--ease);}
.sw input:checked + .sw__track{background:var(--brand);}
.sw input:checked + .sw__track .sw__thumb{transform:translateX(18px);}
.sw input:focus + .sw__track{outline:3px solid var(--ring); outline-offset:2px;}
```

### 3.7 Chips
```html
<button class="chip">Default</button> <button class="chip is-selected">Focus</button>
```
```css
.chip{border:1px solid var(--border); border-radius:var(--r-pill); padding:.35rem .7rem; font:500 14px var(--font);
  background:#fff; color:var(--ink);}
.chip:hover{background:rgba(15,23,42,.04);}
.chip.is-selected{background:color-mix(in srgb,#fff 90%, var(--brand) 10%); box-shadow:0 0 0 2px var(--brand) inset;}
```

### 3.8 Cards & Tiles
```html
<div class="tile tile--info"><div class="label">Trackers Blocked</div><div class="h2 num">1,293</div></div>
<div class="tile tile--alert"><div class="label">Extensions Unified</div><div class="pill">ACTIVE</div></div>
```
```css
.tile{background:var(--panel); border:1px solid var(--border); border-radius:var(--r-card); padding:16px 18px; box-shadow:var(--shadow-1);}
.tile--info{background:var(--t-info);}
.tile--alert{background:var(--t-alert);}
.pill{display:inline-flex; align-items:center; gap:.5ch; padding:.3rem .7rem; border:1px solid var(--border);
  border-radius:var(--r-pill); background:#fff;}
```

### 3.9 Table (Devices)
- Row height 52–56; sticky header; zebra 2% ink.
- First cell includes avatar + name; inline rename on dbl‑click.

```css
.table{width:100%; border-collapse:separate; border-spacing:0;}
.table th, .table td{padding:12px; border-bottom:1px solid var(--border);}
.table thead th{position:sticky; top:0; background:#fff; z-index:1;}
.table tbody tr:hover{background:rgba(15,23,42,.03);}
```

### 3.10 Drawer
```css
.drawer{position:sticky; top:0; align-self:start; background:var(--panel); border:1px solid var(--border);
  border-radius:var(--r-card); box-shadow:var(--shadow-1); padding:16px;}
```

### 3.11 Toast
```html
<div class="toast toast--ok">Applied <b>Focus</b> to Mischa‑Laptop</div>
```
```css
.toast{position:fixed; right:20px; bottom:20px; background:#fff; border:1px solid var(--border);
  border-radius:12px; padding:.6rem .9rem; box-shadow:var(--shadow-2);}
.toast--ok{border-color:color-mix(in srgb, var(--success) 40%, #fff 60%);}
```

---

## 4) Content & Tone
- Use **plain language**: *Routines* (not Schedules), *Pause Internet* (not Disable DNS).
- Button verbs: **Apply**, **Pause 15m**, **Resume**.
- Short, friendly helper text under controls.

---

## 5) Accessibility
- Text contrast ≥ 4.5:1; focus ring visible (`--ring`); targets ≥ 40×40.
- Combobox: roles `combobox`/`listbox`/`option`; keyboard `↑/↓/Enter/Esc`.
- Switch has `role="switch"` and announces state.

---

## 6) Assets
- **Use this logo**: `bushido_shield_logo.svg` (do not recolor).
- Favicon can reuse the same SVG.

---

## 7) Tailwind Mapping (optional)
```js
// tailwind.config.js
export default {{ theme:{{ extend:{{
  colors:{{ brand:'var(--brand)', ink:'var(--ink)', info:'var(--t-info)', alert:'var(--t-alert)', panel:'var(--panel)', border:'var(--border)'}},
  boxShadow:{{ soft:'var(--shadow-1)', deep:'var(--shadow-2)'}},
  borderRadius:{{ card:'16px', control:'10px', pill:'999px'}},
  fontFamily:{{ sans:['Inter','system-ui','sans-serif']}}
}}}}}
```

---

## 8) Done / Not Done
**Do**
- Rounded cards, pill tabs, pill chips, soft toasts.
- Styled native selects or a **combobox** (avoid default grey selects).
- Use **brand red** for primary and focus ring tint.

**Don’t**
- No square corners, heavy shadows, or cramped tables.
- No system‑looking form controls without styling.
- No jargon in copy.

---

> Use this file as the single source of truth for Copilot. All new UI must use these tokens and patterns.
