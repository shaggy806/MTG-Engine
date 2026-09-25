import { defineCard } from "../define.js";

export default defineCard({
  name: "Staff of Domination",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{1}: Untap this artifact.\n{2}, {T}: You gain 1 life.\n{3}, {T}: Untap target creature.\n{4}, {T}: Tap target creature.\n{5}, {T}: Draw a card.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{1}: Untap this artifact.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "{2}, {T}: You gain 1 life.",
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{3}, {T}: Untap target creature.",
    },
    {
      cost: { mana: "{4}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{4}, {T}: Tap target creature.",
    },
    {
      cost: { mana: "{5}", tap: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{5}, {T}: Draw a card.",
    },
  ],
});
