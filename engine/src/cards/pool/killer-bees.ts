import { defineCard } from "../define.js";

export default defineCard({
  name: "Killer Bees",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 0,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{G}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{G}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
