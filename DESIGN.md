---
name: CaloDone
description: A calm meal-check system for photo-first nutrition tracking.
colors:
  blueberry-action: "#59677D"
  blueberry-pressed: "#465267"
  oat-paper: "#F3F0EA"
  ticket-paper: "#FCFAF5"
  carbon-ink: "#292B30"
  quiet-ink: "#6D6F75"
  steel-line: "#CDC9C1"
  day-rail: "#454A56"
  rail-copy: "#E0DDE0"
  success: "#5F7668"
  attention: "#8A6B40"
  error: "#925A58"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  control: "8px"
  surface: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.blueberry-action}"
    textColor: "{colors.ticket-paper}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
    height: "56px"
  ticket:
    backgroundColor: "{colors.ticket-paper}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.surface}"
    padding: "16px"
  input:
    backgroundColor: "{colors.oat-paper}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.control}"
    height: "50px"
---

# Design System: CaloDone

## Overview

**Creative North Star: "The Quiet Kitchen Pass"**

CaloDone treats each meal as a check moving from captured to reviewed to complete. Its kitchen-pass lineage comes from information order, condensed ticket typography, perforated separators, and explicit states rather than theatrical restaurant decoration.

The system is calm, workmanlike, and compact. Warm oat-paper grounds and muted blueberry actions sit comfortably beside meal photography while keeping one-handed tasks clear. The product refuses generic dashboard chrome, ambient AI effects, and decorative precision that makes estimates appear more certain than they are.

**Key Characteristics:**

- One unresolved task may lead Today; totals and history remain visually quiet.
- Ticket structure makes capture, processing, and review states legible.
- Muted blueberry is functional and rare; carbon ink carries hierarchy.
- Motion acknowledges state changes and then gets out of the way.

## Colors

The palette is a cool, low-saturation kitchen workspace with one restrained functional accent.

### Primary

- **Muted Blueberry:** The sole interactive accent for primary actions and selected states. It stays neutral beside warm and cool food photography without reading as medical UI.

### Neutral

- **Oat Paper:** The app field and quiet input ground.
- **Ticket Paper:** Raised working surfaces and meal checks.
- **Carbon Ink:** Primary text and numeric hierarchy.
- **Quiet Ink:** Secondary copy, metadata, and placeholders.
- **Soft Steel:** Dividers, perforations, and container edges.
- **Day Rail:** Day navigation and camera-adjacent structure.

### Named Rules

**The One Accent Rule.** Blueberry marks actions and selected states; it does not become decoration or fill large portions of a screen. Success green, attention amber, and error cranberry appear only as semantic state colors.

**The Honest State Rule.** Attention and error colors appear only when the user has a real decision or recovery action.

## Typography

**Display Font:** Barlow Condensed (with Arial Narrow fallback)

**Body Font:** Roboto (with the platform sans-serif fallback)

**Character:** Condensed headings recall printed kitchen checks and make dense meal names scannable. The body face stays neutral and highly legible for questions, notes, and nutrition detail.

### Hierarchy

- **Display:** Bold condensed type for day names, meal titles, and primary totals.
- **Title:** Bold condensed type for section names, ticket headings, and buttons.
- **Body:** Platform-friendly sans-serif for instructions, questions, and editable values.
- **Label:** Semi-bold condensed type with restrained tracking for statuses and metadata.

### Named Rules

**The Ticket Voice Rule.** Use condensed type for hierarchy and operational labels, never for long explanatory paragraphs.

## Layout

Android phones are the primary canvas. Screens use a 16px outer inset, 8-16px internal gaps, and 24px separation between lifecycle stages. Today follows a strict state ladder: one expanded question or failure requiring action, any additional required items as compact rows, active analysis, the one-line daily summary, completed meals newest first, then the fixed blank capture ticket. Section titles, counts, ingredients, and routine estimate labels stay off this overview.

Capture stays in one camera session. The first shot reveals a tray for removal and an optional note, followed by a primary Use photo action and a secondary Add another angle action. On wider web-preview canvases the phone surface caps at 430px; native Android remains full width and respects system insets.

## Elevation & Depth

The system is flat by default. Borders, tonal shifts, and overlap establish hierarchy; only the persistent capture ticket receives a low ambient lift so it remains findable above scrolling content.

**The Flat Work Surface Rule.** A card does not earn a shadow merely because it is a card. Use elevation only for persistent or physically overlapping controls.

## Motion

Motion explains navigation rather than decorating it. Forward routes enter with an 18px right-to-left settle over 240ms; back routes use a slightly shorter 14px return over 210ms. Same-level changes use a restrained 180ms fade. Photo selection and newly revealed controls use the same short easing family, with no bounce, blur, parallax, or staggered page choreography. Reduced-motion mode replaces spatial movement with a brief opacity acknowledgment and stops looping analysis pulses.

## Shapes

Containers use gently clipped 10px corners, controls use 8px corners, and small stamps use 4px corners. Thin solid edges define structure; dashed rules indicate ticket perforation, provisional capture, or a field awaiting completion. Pills are reserved for true toggles rather than general-purpose labels.

## Components

### Buttons

- **Shape:** Compact rectangular controls with 8px corners and at least a 48px touch target.
- **Primary:** Muted blueberry with ticket-paper text; the main capture completion action may invert to ticket paper on the dark camera tray.
- **Hover / Focus:** Darken the blueberry on hover or press; web focus uses a clear blueberry outline and native controls expose selected and disabled states.
- **Secondary:** Ticket-paper or transparent controls with a steel edge and carbon text.

### Cards / Containers

- **Corner Style:** Gently clipped ticket corners (10px).
- **Background:** Ticket paper on cool paper.
- **Shadow Strategy:** Flat at rest; border-led separation.
- **Border:** Soft steel, with dashed internal perforations where lifecycle groups divide.
- **Internal Padding:** 14-16px on phones.

### Inputs / Fields

- **Style:** Cool-paper fill, 8px corners, carbon text, and a 48-50px minimum height.
- **Focus:** Visible blueberry outline or platform focus treatment.
- **Error / Disabled:** Error copy is muted red; disabled controls retain their shape and reduce opacity.

### Dialogs / Action Sheets

Three-dot/header overflow actions use a compact menu anchored directly below the trigger, without dimming the screen. Confirmations, notices, errors, and unanchored bottom actions use the CaloDone dialog surface: ticket paper, compact rows, one clear hierarchy, and a dimmed carbon backdrop. Never use `Alert.alert` or stock Android action dialogs. OS-owned permission, authentication, camera, photo-picker, and share UI remains native.

### Navigation

Day navigation is one clean row rather than a dashboard header. Previous day, centered date, next day, and settings use outlined icons with 48px targets. The bowl-and-check identity mark belongs to the launcher; it is not repeated in the Today header.

### Meal Check

A meal check owns the meal title, time, estimate, ingredients, capture note, and operational state. Today shows a thumbnail only when a saved photo exists; a photo-less meal remains a clean text row rather than receiving a fake placeholder. Detail shows every saved photo in a compact gallery, opens each photo full-screen, and preserves the user's capture note as quiet record content. Processing meals use a lightly defined working surface, softened thumbnail, restrained pulse, and an Analyzing label in place of calories; they never display a false zero result, AI glow, or invented progress percentage. Correction is a collapsed secondary action at the bottom of meal detail.

### First-Open Setup

First open is a five-step setup, not a product tour: goal, body inputs used by the estimate, activity, editable calorie and macro targets, and AI provider. The target is explicitly presented as an editable estimate rather than medical advice. Setup completion is persisted; goals and provider remain changeable in Settings.

### Provider Selection

Provider rows use the radio/check control itself to communicate selection. Do not repeat changing phrases such as “Selected” and “Use this provider” underneath every name. Adding and switching providers remain separate actions.

### Assistant

Assistant is a primary destination beside Today, not a modal utility. Its empty state asks one quiet question and offers at most two concrete starting prompts. Assistant replies sit directly on the canvas; user messages use a restrained paper fill so the conversation does not become a stack of competing cards. The composer stays above primary navigation and accepts text, camera photos, and existing images.

Meal detail may open Assistant with that meal as visible, removable context. Conversations are local, persistent, and selectable from a simple history list. When Assistant changes a meal or daily goal, show a compact action receipt with Undo; ordinary discussion never looks like an action. Streaming uses a small working indicator and an explicit Stop control, without animated AI decoration.

An unresolved meal clarification appears immediately on the open meal detail and can be answered inline. It also owns one persistent primary clarification conversation, created when the question appears. Opening “Discuss in Assistant” reuses that conversation and shows the question above the feed; “New chat” may create additional conversations linked to the same meal. Meal-to-chat is therefore one-to-many, never a permanent one-to-one lock.

Every real Assistant tool call remains visible in sequence as a quiet operational row, including meal lookup, photo inspection, goal access, mutations, and web search when the provider exposes that call. An active call uses a spinner; completion uses a subdued check; failure uses the error color. Labels describe the operation, never raw arguments or private model reasoning. Thinking is a transient generic status only.

Assistant prose renders a restrained Markdown subset—headings, emphasis, lists, quotes, code, and safe web links—using native text surfaces. “Thinking” is transient interface status only: it never becomes a message and disappears as soon as a reply or tool call begins. Each conversation has one active session owner so screen changes cannot let an older snapshot replace newer history.

The Assistant header keeps one quiet overflow action. It groups New chat with Model settings, giving frequent model switching a short path without adding another permanent icon to the conversation surface.

### Contextual Meal Actions

A normal tap opens a meal. A long press opens the compact secondary menu: Ask Assistant, Reanalyze meal, and Delete. Reanalysis reuses the meal's saved photos and keeps the meal in its existing place while the processing state is visible. Destructive deletion still requires confirmation.

### Goals

Daily Goals keeps direct calorie and macro editing as the primary path. The rarer “Recalculate from your profile” action lives inside that page and reuses the first-open goal, measurements, activity, and target review steps without repeating provider setup.

### Capture Session

The camera remains open after every shot. After capture, the upper surface shows the selected photo—not the live-camera placeholder—and the scrollable thumbnail strip changes that preview. A compact Add photo tile lives inside that strip, an optional note follows, and a trash icon on the preview removes the selected photo. Analyze meal is the single bottom action and queues work in the background. Choosing Add photo returns to the same full viewfinder and shutter used for the first photo, then returns to review after capture. The design does not invent a visible photo-count cap; any production upload constraint must come from measured provider or storage limits.

Before the first photo, the quiet action opposite the gallery opens a manual meal draft in the standard editor. The draft is not persisted until Save, so backing out cannot leave an empty meal in history. All editable screens resize for the Android IME and keep the focused field plus its action reachable above the keyboard.

## Do's and Don'ts

### Do:

- **Do** order screens around the user's next decision before showing summary data.
- **Do** keep direct value editing visible while placing rare natural-language correction at the bottom of meal detail.
- **Do** preserve 48px touch targets, visible focus, reduced-motion behavior, and readable contrast.
- **Do** use the bowl-and-check mark as a compact identity asset, not as content illustration.

### Don't:

- **Don't** recreate a generic macro dashboard or make totals the primary task.
- **Don't** send users through a full review screen after every photo.
- **Don't** make another angle more prominent than accepting the photo already taken.
- **Don't** split conversational correction and direct editing into disconnected flows.
- **Don't** use glows, gradients, sparkles, fake progress, or unsupported nutrition accuracy claims.
- **Don't** turn every status into a badge or every group into another floating card.
- **Don't** use stock Android dialogs for app-owned actions, confirmations, notices, or errors.
