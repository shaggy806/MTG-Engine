import { defineCard } from "../define.js";

// The count is read as the trigger resolves (the card's ruling): it includes
// the spell that triggered it, every spell you cast earlier this turn, and a
// spell cast in response. The Reservoir's own cast doesn't trigger it — it
// isn't on the battlefield yet.
export default defineCard({
  name: "Aetherflux Reservoir",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text:
    "Whenever you cast a spell, you gain 1 life for each spell you've cast this turn.\n" +
    "Pay 50 life: This artifact deals 50 damage to any target.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: { kind: "gain-life", amount: { turnStat: "spells-cast" } },
      resolve: null,
      text: "Whenever you cast a spell, you gain 1 life for each spell you've cast this turn.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 50 },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 50, target: 0 },
      resolve: null,
      text: "Pay 50 life: This artifact deals 50 damage to any target.",
    },
  ],
});
