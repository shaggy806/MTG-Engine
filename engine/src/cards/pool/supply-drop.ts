import { defineCard } from "../define.js";

export default defineCard({
  name: "Supply Drop",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  keywords: ["flash"],
  text: "Flash\nWhen this artifact enters, target creature you control gets +2/+2 until end of turn.\n{4}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: "{4}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{4}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "When this artifact enters, target creature you control gets +2/+2 until end of turn.",
    },
  ],
});
