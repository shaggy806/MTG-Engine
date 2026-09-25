import { defineCard } from "../define.js";

export default defineCard({
  name: "Knight of the Skyward Eye",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  text: "{3}{G}: This creature gets +3/+3 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{3}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "{3}{G}: This creature gets +3/+3 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
