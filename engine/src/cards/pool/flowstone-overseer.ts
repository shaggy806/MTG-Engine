import { defineCard } from "../define.js";

export default defineCard({
  name: "Flowstone Overseer",
  manaCost: "{2}{R}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 4,
  text: "{R}{R}: Target creature gets +1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}{R}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{R}{R}: Target creature gets +1/-1 until end of turn.",
    },
  ],
});
