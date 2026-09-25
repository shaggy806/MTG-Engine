import { defineCard } from "../define.js";

export default defineCard({
  name: "Parapet Watchers",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Kithkin", "Soldier"],
  power: 2,
  toughness: 2,
  text: "{W/U}: This creature gets +0/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{W/U}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{W/U}: This creature gets +0/+1 until end of turn.",
    },
  ],
});
