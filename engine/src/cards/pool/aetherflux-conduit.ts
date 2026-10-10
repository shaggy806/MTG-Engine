import { defineCard } from "../define.js";

// EDHREC rank 5592. The energy is the mana actually spent on the spell
// (`manaSpentOf` — 0 for one cast without paying its mana cost). The spells
// from hand are cast one after another as the ability resolves.
const ENERGY =
  "Whenever you cast a spell, you get an amount of {E} (energy counters) equal to the amount of mana spent to cast that spell.";
const DRAW =
  "{T}, Pay fifty {E}: Draw seven cards. You may cast any number of spells from your hand without paying their mana costs.";

export default defineCard({
  name: "Aetherflux Conduit",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  text: `${ENERGY}\n${DRAW}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: { kind: "get-energy", amount: { manaSpentOf: "trigger-object" } },
      resolve: null,
      text: ENERGY,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, payEnergy: 50 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 7 },
          { kind: "cast-now", from: "hand", free: true, repeat: true },
        ],
      },
      resolve: null,
      text: DRAW,
    },
  ],
});
