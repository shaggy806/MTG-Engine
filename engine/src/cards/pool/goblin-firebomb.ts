import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Firebomb",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  keywords: ["flash"],
  text: "Flash\n{7}, {T}, Sacrifice this artifact: Destroy target permanent.",
  activated: [
    {
      cost: { mana: "{7}", tap: true, sacrifice: "self" },
      targets: ["permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{7}, {T}, Sacrifice this artifact: Destroy target permanent.",
    },
  ],
});
