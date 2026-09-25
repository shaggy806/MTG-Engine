import { defineCard } from "../define.js";

export default defineCard({
  name: "Plated Rootwalla",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Lizard"],
  power: 3,
  toughness: 3,
  text: "{2}{G}: This creature gets +3/+3 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{G}: This creature gets +3/+3 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
