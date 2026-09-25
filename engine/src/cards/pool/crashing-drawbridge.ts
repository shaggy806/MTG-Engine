import { defineCard } from "../define.js";

export default defineCard({
  name: "Crashing Drawbridge",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender\n{T}: Creatures you control gain haste until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "haste",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{T}: Creatures you control gain haste until end of turn.",
    },
  ],
});
