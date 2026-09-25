import { defineCard } from "../define.js";

export default defineCard({
  name: "Water Servant",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 4,
  text: "{U}: This creature gets +1/-1 until end of turn.\n{U}: This creature gets -1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gets +1/-1 until end of turn.",
    },
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: -1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gets -1/+1 until end of turn.",
    },
  ],
});
