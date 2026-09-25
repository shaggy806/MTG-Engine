import { defineCard } from "../define.js";

export default defineCard({
  name: "Darksteel Pendant",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  keywords: ["indestructible"],
  text: "Indestructible (Effects that say \"destroy\" don't destroy this artifact.)\n{1}, {T}: Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Scry 1.",
    },
  ],
});
