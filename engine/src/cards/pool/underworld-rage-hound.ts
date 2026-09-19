import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 6b — escape. Cast from hand for `{1}{R}`, or from the graveyard
 * for `{3}{R}` plus exiling three other cards there. Unlike flashback, an
 * escaped creature just resolves onto the battlefield and can be escaped again
 * later — and this one arrives bigger each time (`escape.counters`).
 */
export default defineCard({
  name: "Underworld Rage-Hound",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 3,
  toughness: 1,
  text:
    "Underworld Rage-Hound attacks each combat if able.\n" +
    "Escape—{3}{R}, Exile three other cards from your graveyard.\n" +
    "Underworld Rage-Hound escapes with a +1/+1 counter on it.",
  escape: { cost: "{3}{R}", exileCount: 3, counters: { kind: "+1/+1", amount: 1 } },
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "Underworld Rage-Hound attacks each combat if able.",
    },
  ],
});
