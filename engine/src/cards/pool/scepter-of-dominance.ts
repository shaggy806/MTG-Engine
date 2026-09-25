import { defineCard } from "../define.js";

export default defineCard({
  name: "Scepter of Dominance",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["artifact"],
  text: "{W}, {T}: Tap target permanent.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: ["permanent"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{W}, {T}: Tap target permanent.",
    },
  ],
});
