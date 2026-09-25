import { defineCard } from "../define.js";

export default defineCard({
  name: "Trip Noose",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{2}, {T}: Tap target creature.",
    },
  ],
});
