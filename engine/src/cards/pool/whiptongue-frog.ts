import { defineCard } from "../define.js";

export default defineCard({
  name: "Whiptongue Frog",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Frog"],
  power: 1,
  toughness: 3,
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
