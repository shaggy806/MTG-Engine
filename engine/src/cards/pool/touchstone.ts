import { defineCard } from "../define.js";

export default defineCard({
  name: "Touchstone",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Tap target artifact you don't control.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["artifact-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{T}: Tap target artifact you don't control.",
    },
  ],
});
