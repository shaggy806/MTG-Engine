import { defineCard } from "../define.js";

export default defineCard({
  name: "Flowstone Mauler",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 5,
  keywords: ["trample"],
  text: "Trample\n{R}: This creature gets +1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +1/-1 until end of turn.",
    },
  ],
});
