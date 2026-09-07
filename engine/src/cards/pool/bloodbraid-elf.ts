import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 8 — cascade. The `this-cast` trigger runs the `cascade`
 * effect: exile off the top of the library until a nonland card with mana
 * value < 4 turns up, cast it without paying (targets auto-chosen — the
 * `chooseTargets` gap), the rest to the bottom at random. The "you may" is
 * always taken.
 */
export default defineCard({
  name: "Bloodbraid Elf",
  manaCost: "{2}{R}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Berserker"],
  power: 3,
  toughness: 2,
  keywords: ["haste"],
  text: "Cascade (When you cast this spell, exile cards from the top of your library until you exile a nonland card whose mana value is less than this spell's mana value. You may cast it without paying its mana cost. Put the exiled cards on the bottom of your library in a random order.)\nHaste",
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "cascade" },
      resolve: null,
      text: "Cascade.",
    },
  ],
});
