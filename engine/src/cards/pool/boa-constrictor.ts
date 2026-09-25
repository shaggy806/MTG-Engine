import { defineCard } from "../define.js";

export default defineCard({
  name: "Boa Constrictor",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 3,
  toughness: 3,
  text: "{T}: This creature gets +3/+3 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: This creature gets +3/+3 until end of turn.",
    },
  ],
});
