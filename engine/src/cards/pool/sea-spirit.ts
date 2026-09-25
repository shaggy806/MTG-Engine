import { defineCard } from "../define.js";

export default defineCard({
  name: "Sea Spirit",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental", "Spirit"],
  power: 2,
  toughness: 3,
  text: "{U}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
