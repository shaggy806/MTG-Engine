import { defineCard } from "../define.js";

export default defineCard({
  name: "Pacification Array",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}: Tap target artifact or creature.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: ["artifact-or-creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{2}, {T}: Tap target artifact or creature.",
    },
  ],
});
