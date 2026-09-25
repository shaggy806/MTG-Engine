import { defineCard } from "../define.js";

export default defineCard({
  name: "Coastal Hornclaw",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 3,
  toughness: 3,
  text: "Sacrifice a land: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a land: This creature gains flying until end of turn.",
    },
  ],
});
