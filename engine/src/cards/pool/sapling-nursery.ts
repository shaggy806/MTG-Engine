import { defineCard } from "../define.js";
import { affinity } from "../helpers.js";

// EDHREC rank 4389.
//
// Rulings:
//   [2025-11-17] A landfall ability doesn't trigger if a permanent already on the battlefield
//     becomes a land.
//   [2025-11-17] A landfall ability triggers whenever a land you control enters for any reason.

const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, create a 3/4 green Treefolk creature token with reach.";
const EXILE_TEXT =
  "{1}{G}, Exile this enchantment: Treefolk and Forests you control gain indestructible until end of turn.";

export default defineCard({
  name: "Sapling Nursery",
  manaCost: "{6}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `Affinity for Forests (This spell costs {1} less to cast for each Forest you control.)\n${LANDFALL_TEXT}\n${EXILE_TEXT}`,
  selfCostReduction: affinity({ subtype: "Forest" }),
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, exileSelf: true },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { controlledBy: "you", anyOf: [{ subtype: "Treefolk" }, { subtype: "Forest" }] },
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "Treefolk Token", count: 1 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
