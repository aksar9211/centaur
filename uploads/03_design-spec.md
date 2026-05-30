# Centaur Design Spec

This is the build brief for the Centaur website. It is self-contained: it is the only file Claude Design (or a coding agent) needs to start. It specifies the goal, the audience, the structure, the content, and the behavior. It deliberately does not specify the visual treatment in pixels; the brand foundation in `templates/centaur_brand_seed.md` drives palette, type, and motion, and Design infers those from it. Where this spec and the brand seed disagree, the brand seed wins on look and this spec wins on behavior.

No em dashes. No en dashes. UI strings that appear below in quotes are verbatim and must ship as written; if a string should change, propose the change and wait.

---

## Goal

Build a working web app that makes a knowledge worker sharper when they use AI rather than duller. The user types in a task they were about to hand to AI. Centaur classifies the handoff as one of three named choices, shows the evidence behind the classification and a corrective action, and logs the result locally. Over time a drift indicator surfaces the user's pattern. The product reports; it does not scold.

The validation behind this product lives in `02_market-validation.md`. The problem and the mechanism are evidence-backed; demand is not yet tested. The design implication is that the first build has to be the smallest thing that produces a real Defer ratio from a real user, so the team can test adoption. Do not gold-plate.

## Audience

Knowledge workers in AI-saturated workflows who have started to notice they feel sharp in the moment and dull over time. They are not beginners and they are not anxious; they are competent people who want an honest instrument, not a coach. The interface should treat them as the smartest person in the room and never flatter them.

## What the product is, in one loop

1. The user enters a task they were about to hand off to AI.
2. Centaur classifies it as "Direct", "Delegate", or "Defer".
3. Centaur shows the evidence for the classification and a corrective action.
4. The user can accept the classification or override it.
5. The result is logged locally, and the running drift indicator updates.

The three categories, verbatim, with their meanings:

- "Direct": the user is holding the thinking. They use AI as a sounding board but the judgment stays with them.
- "Delegate": the user hands over a bounded outcome and inspects the result. The thinking is shared; the user still checks the work.
- "Defer": the user outsources the judgment itself. The AI decides; the user accepts.

A Defer is not automatically a failure. Per the strategic-AI finding in the validation doc, deferring can be the correct call for some tasks. The classification reports what happened; it does not moralize. The drift indicator surfaces the pattern; it does not assign blame.

---

## Screens

Four screens. Named here, structured here, but Design decides the exact layout from the content and the constraints.

### 1. Capture

The entry point and the default screen. One input where the user enters the task they were about to hand off. One primary action to submit. The screen has to be usable one-handed with a thumb on a phone, so the input and the submit action sit in the lower two thirds of the viewport on mobile.

Primary action label, verbatim: "Classify this handoff".

Nothing else competes for attention here. This is the screen the user sees most; it should feel like a single clean instruction, not a dashboard.

### 2. Classification

The verdict screen. It shows, in this order of visual weight:

1. The category: "Direct", "Delegate", or "Defer".
2. The evidence: the specific reasoning that produced the classification, in plain language. This is non-negotiable. Every verdict shows its evidence. No black-box judgments.
3. The corrective action: one concrete thing the user could do to keep more of the thinking, written as a suggestion, not a command.
4. An override control: the user can mark the classification as wrong. The override is logged.

The category treatment reads as a measurement, not a judgment. Think of a geometric weight indicator or a position on a scale, not a red or green light and not a colored fill that codes "good" or "bad". The product is reporting a reading, the way an instrument reports a value.

Override control label, verbatim: "Mark this classification as wrong".

### 3. History

The user's running log. The highest-value element on this screen is the drift indicator, and it has to read as the highest-value element: a single top-of-page card with one number (the current Defer ratio or drift reading) and one short sentence of plain-language context. The log of past classifications sits underneath and is allowed to breathe; individual rows are lower weight than the drift card.

The drift indicator is a measurement, not a guilt trip. The sentence under the number states what the number is, not how the user should feel about it.

This screen also holds the opt-out control for the drift indicator (see Controls below).

### 4. Empty state

What a first-time user sees before they have any history. It teaches the three categories without lecturing. Tone is a colleague telling you the truth, not a coach welcoming you to an app. No motivational language, no exclamation points. Three short definitions and one line on what the tool does, then the path into the Capture screen.

---

## The three required controls

These are not optional polish. They come from `context_files/centaur_ethics_brief.md` and they exist to keep the product from becoming the manipulation it set out to fix. All three ship in the first build.

1. Transparent classification reasoning. Every verdict on the Classification screen shows its evidence. There is no version of the verdict screen without the evidence.
2. User override on every classification. The user can mark any classification as wrong, on every verdict, and the override is logged so the record stays honest.
3. Opt-out toggle for the drift indicator. The user can disable the drift indicator entirely from the History screen. When it is off, the tool still classifies and still logs; it just stops surfacing the running ratio. Toggle label, verbatim: "Show drift indicator".

---

## Copy and tone

Sharp, dry, specific. The voice is competent and restrained: warm but not cute, expert but not academic, direct but not blunt. It never flatters the user and never scolds them.

Rules that apply to every string in the product, including error states and microcopy:

- No motivational language. No "Great job", no "You've got this".
- No exclamation points.
- No em dashes and no en dashes. Use commas, periods, semicolons, colons, or parentheses.
- Verdict copy frames a Defer as a measurement, never as a moral failure. "You deferred this one" is reporting. "You gave up your thinking" is scolding, and is banned.
- Corrective actions are suggestions, not commands. "You could hold the framing yourself and use the AI to pressure-test it" is right. "Do not defer this" is wrong.

---

## Visual direction (guardrails, not a spec)

Design infers the visual treatment from `templates/centaur_brand_seed.md`. The brand sits on the Sage and Magician archetypes, scores dominant on Competence and Sophistication, and its essence is "Instrument for judgment". The following are guardrails on what Design infers, not a substitute for it:

- It should read closer to a precision instrument or a terminal than to a meditation or wellness app, with consumer-product restraint so it still feels approachable.
- Negative space is the dominant element. High information density is allowed on the History screen but never crowding.
- Two-color floor with one accent reserved for state changes. The three categories do not get a traffic-light palette; their distinction is communicated through form and weight, not through good-versus-bad color.
- One workhorse sans for the interface, one display face for the moments that matter (the verdict, the drift number). No script faces, no decorative type.
- Motion is functional only. It signals a state change. No decorative animation, no particle effects, no circuit-board "AI" iconography.

Things to avoid: stock illustrations, gradients on body copy, emoji as UI, anything that signals "fun" or "playful", anything that signals "AI" through visual cliche. The product's intelligence shows in what it does, not in how it looks.

---

## Responsiveness

Mobile-first, responsive to tablet and desktop. The Capture screen is designed for one-handed thumb use on a phone first, then scaled up. Test the breakpoints; the verdict and the drift card must hold their hierarchy at every width.

---

## Technical constraints (fixed, from the standing rules)

These come from `templates/CLAUDE_template.md` and are not negotiable in the build:

- Plain stack. HTML, CSS, and vanilla JS, or one small framework only if the design genuinely requires it. No build pipeline unless explicitly asked.
- Single-page web app, hosted as a static site on GitHub Pages with no configuration. Anything that would not work as a static site from a GitHub Pages root has to be flagged before it is built.
- No backend, no accounts, no auth, no database. All state in browser localStorage. The user owns their history; the product does not phone home.
- One start command, documented in the README.
- The user's session history is exportable, because the record is theirs.

---

## Accessibility

Treat accessibility as part of the instrument, not an afterthought. Sufficient contrast on all text, keyboard operability for the full classify-and-review loop, and the category distinction must survive for a user who cannot rely on color, which the form-and-weight treatment already requires.

---

## What is fixed and what Design decides

Fixed: the four screens and their content, the three verbatim category names, the three required controls, the verbatim labels called out above, the copy tone rules, the no-dash rule, and the technical constraints.

Design decides: exact layout and composition, the palette and type within the guardrails, the specific form the category indicator and the drift indicator take, spacing and rhythm, and the motion that signals state change.

When the structure is settled, iterate toward polish; do not start polished. Build the first pass, then refine.

---

## Source references

- `02_market-validation.md` (why the build is scoped to a minimal Defer-ratio test; why a Defer can be correct)
- `templates/centaur_brand_seed.md` (brand foundation that drives the visual treatment)
- `templates/CLAUDE_template.md` (standing rules and technical constraints)
- `context_files/centaur_ethics_brief.md` (the three required controls)
- `context_files/cognitive_enhancement_principles.md` (the loop: visible thinking, surfaced reasoning, deliberate handoff, actionable drift, owned record)
