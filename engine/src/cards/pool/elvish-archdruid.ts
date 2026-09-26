import { defineCard } from "../define.js";

const MANA = "{T}: Add {G} for each Elf you control.";

// The lord is "other"; the mana counts every Elf you control, this one too.
export default defineCard({
  name: "Elvish Archdruid",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 2,
  text: `Other Elf creatures you control get +1/+1.\n${MANA}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Elf" },
      grantPt: [1, 1],
      text: "Other Elf creatures you control get +1/+1.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: { countOf: { subtype: "Elf", controlledBy: "you" } } },
      resolve: null,
      text: MANA,
    },
  ],
});
