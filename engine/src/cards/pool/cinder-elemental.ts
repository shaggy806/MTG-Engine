import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-3 — a real card whose *activated* ability has `{X}` in
 * its mana cost. The chosen X is folded into the payment and stamped on the
 * ability object, so `amount: "x"` reads it at resolution.
 */
export default defineCard({
  name: "Cinder Elemental",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 2,
  toughness: 2,
  text: "{X}{R}, {T}, Sacrifice Cinder Elemental: It deals X damage to any target.",
  activated: [
    {
      cost: { mana: "{X}{R}", tap: true, sacrifice: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: "x", target: 0 },
      resolve: null,
      text: "{X}{R}, {T}, Sacrifice Cinder Elemental: It deals X damage to any target.",
    },
  ],
});
