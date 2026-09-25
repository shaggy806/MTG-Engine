import { defineCard } from "../define.js";

export default defineCard({
  name: "Sacred Armory",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{2}: Target creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{2}: Target creature gets +1/+0 until end of turn.",
    },
  ],
});
