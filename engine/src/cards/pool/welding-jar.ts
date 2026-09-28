import { defineCard } from "../define.js";

const TEXT = "Sacrifice this artifact: Regenerate target artifact.";

export default defineCard({
  name: "Welding Jar",
  manaCost: "{0}",
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["artifact"],
      effect: { kind: "regenerate", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
