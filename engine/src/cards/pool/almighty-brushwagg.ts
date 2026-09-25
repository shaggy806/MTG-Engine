import { defineCard } from "../define.js";

export default defineCard({
  name: "Almighty Brushwagg",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Brushwagg"],
  power: 1,
  toughness: 1,
  keywords: ["trample"],
  text: "Trample\n{3}{G}: This creature gets +3/+3 until end of turn.",
  activated: [
    {
      cost: { mana: "{3}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "{3}{G}: This creature gets +3/+3 until end of turn.",
    },
  ],
});
