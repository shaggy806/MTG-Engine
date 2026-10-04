import { defineCard } from "../define.js";

// EDHREC rank 4686.

export default defineCard({
  name: "Vodalian Hexcatcher",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 1,
  keywords: ["flash"],
  text: "Flash\nOther Merfolk you control get +1/+1.\nSacrifice a Merfolk: Counter target noncreature spell unless its controller pays {1}.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Merfolk" },
      grantPt: [1, 1],
      text: "Other Merfolk you control get +1/+1.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Merfolk" } } },
      targets: ["noncreature-spell"],
      // Stubborn Denial's "unless its controller pays {1}".
      effect: {
        kind: "unless",
        chooser: 0,
        options: [{ pay: "{1}", text: "Pay {1}" }],
        otherwise: { kind: "counter", target: 0 },
      },
      resolve: null,
      text: "Sacrifice a Merfolk: Counter target noncreature spell unless its controller pays {1}.",
    },
  ],
});
