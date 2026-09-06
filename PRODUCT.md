# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

CalDone is primarily for busy people who want useful calorie and macro tracking without turning meal logging into a separate task.

## Product Purpose

CalDone turns a meal photo into an editable nutrition log with minimal interruption. Success means a user can capture what they ate, return to their day, and later review or correct a useful record without reconstructing the meal by hand.

## Positioning

The core promise is photo-to-log: capture the meal as it is, then receive an editable nutrition record instead of manually searching for and entering every item.

## Operating Context

- The primary moment of use is at or immediately after a meal, when speed and one-handed phone use matter.
- Analysis may finish after the user has left the capture flow, so the product must make pending work, results, and corrections understandable without demanding attention.
- Nutrition output is an estimate and must remain correctable by the user.

## Capabilities and Constraints

- The committed product capability is photo-to-editable-log on Android.
- Features found in the prototype, including ChatGPT account connection, multi-photo capture, background processing, clarifying questions, daily goals, English and Russian localization, private-photo cleanup, notifications, and a home-screen widget, are evidence of prior exploration rather than requirements for the redesign.
- The redesign may re-evaluate navigation, workflows, information architecture, and every secondary capability.
- The current interface is not visual authority and must not constrain the replacement design.
- Nutrition values are estimates. Future design work must not imply clinical accuracy or verified food-database provenance without new evidence.

## Brand Commitments

- The incumbent product name is **CalDone**. Renaming remains an open decision; until then, use CalDone without inventing a new logo or identity claim.
- No palette, typography, illustration style, component language, or other visual direction from the prototype is binding.

## Evidence on Hand

- `prototypes/pi-mobile-spike/README.md` describes the first usable Android vertical slice and its known technical boundaries.
- `prototypes/pi-mobile-spike/src/` contains working explorations of capture, meal analysis states, review, correction, goals, localization, notifications, privacy behavior, and the Android widget.
- `web-preview/` is the public interactive design prototype. It demonstrates proposed UX, including provider-management concepts that are not yet backed by native integrations.
- No user research, production usage data, testimonials, clinical validation, nutrition-database evidence, or established brand assets are present. Future work must not fabricate them.

## Product Principles

1. Logging should fit into the meal moment, not compete with it.
2. Capture first; let processing and review happen without holding the user in place.
3. Estimates must be transparent and easy to correct.
4. Product decisions should earn their place through the busy-tracker use case, not through prototype precedent.
5. Never present unsupported nutrition accuracy, trust, or adoption claims as fact.
