import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

// EDHREC rank 3641.
//
// "Gonti's Aether Heart or another artifact you control" is every other
// artifact you control, and itself whatever it is then (`thisOrAnother`,
// Bloomvine Regent's shape). The activated
// ability is Aether Hub's `payEnergy` cost with `exileSelf`.

const ENERGY_TEXT =
  "Whenever Gonti's Aether Heart or another artifact you control enters, you get {E}{E} (two energy counters).";
const TURN_TEXT = "Pay eight {E}, Exile Gonti's Aether Heart: Take an extra turn after this one.";

export default defineCard({
  name: "Gonti's Aether Heart",
  manaCost: "{6}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${ENERGY_TEXT}\n${TURN_TEXT}`,
  triggered: [
    ...thisOrAnother({
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "get-energy", amount: 2 },
      resolve: null,
      text: ENERGY_TEXT,
    }),
  ],
  activated: [
    {
      cost: { mana: null, tap: false, payEnergy: 8, exileSelf: true },
      targets: [],
      effect: { kind: "take-extra-turn" },
      resolve: null,
      text: TURN_TEXT,
    },
  ],
});
