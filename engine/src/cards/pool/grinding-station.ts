import { defineCard } from "../define.js";

export default defineCard({
  name: "Grinding Station",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{T}, Sacrifice an artifact: Target player mills three cards.\nWhenever an artifact enters, you may untap this artifact.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 3 },
      resolve: null,
      text: "{T}, Sacrifice an artifact: Target player mills three cards.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "may", prompt: "Untap ~?", effect: { kind: "untap", target: "source" } },
      resolve: null,
      text: "Whenever an artifact enters, you may untap this artifact.",
    },
  ],
});
