import { defineCard } from "../define.js";

export default defineCard({
  name: "Obscura Initiate",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Citizen"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{1}{W/B}: This creature gains lifelink until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W/B}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "lifelink", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{W/B}: This creature gains lifelink until end of turn.",
    },
  ],
});
