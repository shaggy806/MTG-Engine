import { defineCard } from "../define.js";

export default defineCard({
  name: "Snarling Wolf",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 1,
  toughness: 1,
  text: "{1}{G}: This creature gets +2/+2 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{G}: This creature gets +2/+2 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
