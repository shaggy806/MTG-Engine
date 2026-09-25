import { defineCard } from "../define.js";

export default defineCard({
  name: "Flowstone Hellion",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Hellion", "Beast"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste\n{0}: This creature gets +1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{0}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{0}: This creature gets +1/-1 until end of turn.",
    },
  ],
});
