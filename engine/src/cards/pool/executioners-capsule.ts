import { defineCard } from "../define.js";

export default defineCard({
  name: "Executioner's Capsule",
  manaCost: "{B}",
  colors: ["B"],
  types: ["artifact"],
  text: "{1}{B}, {T}, Sacrifice this artifact: Destroy target nonblack creature.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: true, sacrifice: "self" },
      targets: ["nonblack-creature"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{1}{B}, {T}, Sacrifice this artifact: Destroy target nonblack creature.",
    },
  ],
});
