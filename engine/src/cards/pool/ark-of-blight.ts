import { defineCard } from "../define.js";

export default defineCard({
  name: "Ark of Blight",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{3}, {T}, Sacrifice this artifact: Destroy target land.",
  activated: [
    {
      cost: { mana: "{3}", tap: true, sacrifice: "self" },
      targets: ["land"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{3}, {T}, Sacrifice this artifact: Destroy target land.",
    },
  ],
});
