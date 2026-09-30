import { defineCard } from "../define.js";

const TEXT = "{T}: Add {G} for each creature you control with defender.";

export default defineCard({
  name: "Overgrown Battlement",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: `Defender\n${TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: { countOf: { type: "creature", controlledBy: "you", keyword: "defender" } } },
      resolve: null,
      text: TEXT,
    },
  ],
});
