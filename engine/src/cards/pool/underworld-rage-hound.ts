import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 6b — escape. Cast from hand for `{1}{R}`, or from the graveyard
 * for `{2}{R}` plus exiling two other cards there. Unlike flashback, an escaped
 * creature just resolves onto the battlefield and can be escaped again later.
 */
export default defineCard({
  name: "Underworld Rage-Hound",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 3,
  toughness: 1,
  text: "Underworld Rage-Hound can't block.\nEscape—{2}{R}, Exile two other cards from your graveyard.",
  escape: { cost: "{2}{R}", exileCount: 2 },
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "Underworld Rage-Hound can't block.",
    },
  ],
});
