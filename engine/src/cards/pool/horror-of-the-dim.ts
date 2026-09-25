import { defineCard } from "../define.js";

export default defineCard({
  name: "Horror of the Dim",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 3,
  toughness: 4,
  text: "{U}: This creature gains hexproof until end of turn. (It can't be the target of spells or abilities your opponents control.)",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "hexproof", duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gains hexproof until end of turn.",
    },
  ],
});
