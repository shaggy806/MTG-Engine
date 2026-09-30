import { defineCard } from "../define.js";

const TEXT = "{T}: Add X mana in any combination of colors, where X is the number of creatures you control with defender.";

export default defineCard({
  name: "Axebane Guardian",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: `Defender\n${TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["W", "U", "B", "R", "G"] },
        amount: { countOf: { type: "creature", controlledBy: "you", keyword: "defender" } },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
