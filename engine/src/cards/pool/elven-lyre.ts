import { defineCard } from "../define.js";

export default defineCard({
  name: "Elven Lyre",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}, Sacrifice this artifact: Target creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{1}, {T}, Sacrifice this artifact: Target creature gets +2/+2 until end of turn.",
    },
  ],
});
