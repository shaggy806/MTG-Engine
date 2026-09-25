import { defineCard } from "../define.js";

export default defineCard({
  name: "Grimclaw Bats",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Bat"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{B}, Pay 1 life: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, payLife: 1 },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{B}, Pay 1 life: This creature gets +1/+1 until end of turn.",
    },
  ],
});
