import { defineCard } from "../define.js";

export default defineCard({
  name: "Whirlermaker",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{4}, {T}: Create a 1/1 colorless Thopter artifact creature token with flying.",
  activated: [
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: "{4}, {T}: Create a 1/1 colorless Thopter artifact creature token with flying.",
    },
  ],
});
