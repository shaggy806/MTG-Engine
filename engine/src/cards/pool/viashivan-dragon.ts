import { defineCard } from "../define.js";

export default defineCard({
  name: "Viashivan Dragon",
  manaCost: "{2}{R}{R}{G}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\n{R}: This creature gets +1/+0 until end of turn.\n{G}: This creature gets +0/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +1/+0 until end of turn.",
    },
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{G}: This creature gets +0/+1 until end of turn.",
    },
  ],
});
