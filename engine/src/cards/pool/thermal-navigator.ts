import { defineCard } from "../define.js";

export default defineCard({
  name: "Thermal Navigator",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 2,
  toughness: 2,
  text: "Sacrifice an artifact: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice an artifact: This creature gains flying until end of turn.",
    },
  ],
});
