import { defineCard } from "../define.js";

export default defineCard({
  name: "Folk of the Pines",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 2,
  toughness: 5,
  text: "{1}{G}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{G}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
