import { defineCard } from "../define.js";

export default defineCard({
  name: "Stonewood Invoker",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Mutant"],
  power: 2,
  toughness: 2,
  text: "{7}{G}: This creature gets +5/+5 until end of turn.",
  activated: [
    {
      cost: { mana: "{7}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 5, toughness: 5, duration: "end-of-turn" },
      resolve: null,
      text: "{7}{G}: This creature gets +5/+5 until end of turn.",
    },
  ],
});
