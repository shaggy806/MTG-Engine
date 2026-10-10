import { defineCard } from "../define.js";

// EDHREC rank 275. Gix, Yawgmoth Praetor's shape: one top card from every
// player's library, then any number of spells cast from among them, one at
// a time, each free (lands among them stay exiled — it says "spells").
const ATTACK =
  "Whenever Etali attacks, exile the top card of each player's library, then you may cast any number of spells from among those cards without paying their mana costs.";

export default defineCard({
  name: "Etali, Primal Storm",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dinosaur"],
  power: 6,
  toughness: 6,
  text: ATTACK,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile-from-library", whose: "each-player", amount: 1 },
          { kind: "cast-now", from: "exiled-this-way", free: true, repeat: true },
        ],
      },
      resolve: null,
      text: ATTACK,
    },
  ],
});
