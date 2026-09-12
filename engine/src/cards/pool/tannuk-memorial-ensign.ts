import { defineCard } from "../define.js";

// needed-cards P16. Drops "if this is the second time this ability has
// resolved this turn, draw a card" — counting a specific ability's own
// resolutions this turn (reset at the next turn) isn't tracked anywhere the
// engine keeps state; approximated the same way other cards drop a clause
// (Sylvan Safekeeper's shroud-as-hexproof, Saw in Half's dropped gate).
export default defineCard({
  name: "Tannuk, Memorial Ensign",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kavu", "Pilot"],
  power: 2,
  toughness: 4,
  text: "Landfall — Whenever a land you control enters, Tannuk deals 1 damage to each opponent.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, Tannuk deals 1 damage to each opponent.",
    },
  ],
});
