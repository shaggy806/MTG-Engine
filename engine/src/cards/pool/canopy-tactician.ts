import { defineCard } from "../define.js";

// EDHREC rank 3231.
//
// Rulings:
//   [2021-02-05] Because damage remains marked on creatures until the damage is removed as the
//     turn ends, nonlethal damage dealt to Elves you control may become lethal if Canopy Tactician
//     leaves the battlefield that turn.

const LORD_TEXT = "Other Elves you control get +1/+1.";

export default defineCard({
  name: "Canopy Tactician",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 3,
  toughness: 3,
  text: `${LORD_TEXT}\n{T}: Add {G}{G}{G}.`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Elf" },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 3 },
      resolve: null,
      text: "{T}: Add {G}{G}{G}.",
    },
  ],
});
