import { defineCard } from "../define.js";

export default defineCard({
  name: "Llanowar Vanguard",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 1,
  toughness: 1,
  text: "{T}: This creature gets +0/+4 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 4, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: This creature gets +0/+4 until end of turn.",
    },
  ],
});
