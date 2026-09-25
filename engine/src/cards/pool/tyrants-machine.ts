import { defineCard } from "../define.js";

export default defineCard({
  name: "Tyrant's Machine",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{4}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{4}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{4}, {T}: Tap target creature.",
    },
  ],
});
