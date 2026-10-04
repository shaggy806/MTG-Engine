import { defineCard } from "../define.js";

// EDHREC rank 5017.
//
// Rulings:
//   [2008-08-01] The ability puts a -1/-1 counter on Soul Snuffers, too.

export default defineCard({
  name: "Soul Snuffers",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elemental", "Shaman"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, put a -1/-1 counter on each creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Every creature, itself included (the ruling).
      effect: { kind: "add-counter-all", filter: { type: "creature" }, counter: "-1/-1", amount: 1 },
      resolve: null,
      text: "When this creature enters, put a -1/-1 counter on each creature.",
    },
  ],
});
