import { defineCard } from "../define.js";

export default defineCard({
  name: "Universal Solvent",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{7}, {T}, Sacrifice this artifact: Destroy target permanent.",
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
