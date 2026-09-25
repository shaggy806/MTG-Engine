import { defineCard } from "../define.js";

export default defineCard({
  name: "Manta Riders",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk"],
  power: 1,
  toughness: 1,
  text: "{U}: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gains flying until end of turn.",
    },
  ],
});
