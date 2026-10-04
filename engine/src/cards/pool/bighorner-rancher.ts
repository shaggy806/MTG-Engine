import { defineCard } from "../define.js";

// EDHREC rank 6134.
//
// Rulings:
//   [2024-03-08] Bighorner Rancher's second ability is a mana ability. It doesn't use the stack
//     and can't be responded to. If the greatest power among creatures you control is somehow 0 or
//     less, no mana is added.
//   [2024-03-08] The amount of life you gain from Bighorner Rancher's last ability is determined
//     when the ability resolves.

const MANA_TEXT = "{T}: Add an amount of {G} equal to the greatest power among creatures you control.";
const LIFE_TEXT =
  "Sacrifice this creature: You gain life equal to the greatest toughness among other creatures you control.";

export default defineCard({
  name: "Bighorner Rancher",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Ranger"],
  power: 2,
  toughness: 5,
  keywords: ["vigilance"],
  text: `Vigilance\n${MANA_TEXT}\n${LIFE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "G",
        amount: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
      },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      // Read as it resolves (the ruling). The Rancher is already gone as the
      // cost; `excludeSelf` keeps it out regardless.
      effect: {
        kind: "gain-life",
        amount: {
          aggregate: "max",
          of: "toughness",
          filter: { type: "creature", controlledBy: "you" },
          excludeSelf: true,
        },
      },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
});
