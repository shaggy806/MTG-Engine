import { defineCard } from "../define.js";

export default defineCard({
  name: "Bumbleflower's Sharepot",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "When this artifact enters, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")\n{5}, {T}, Sacrifice this artifact: Destroy target nonland permanent. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{5}", tap: true, sacrifice: "self" },
      targets: ["nonland-permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{5}, {T}, Sacrifice this artifact: Destroy target nonland permanent. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "When this artifact enters, create a Food token.",
    },
  ],
});
