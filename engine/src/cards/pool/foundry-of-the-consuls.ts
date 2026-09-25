import { defineCard } from "../define.js";

export default defineCard({
  name: "Foundry of the Consuls",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{5}, {T}, Sacrifice this land: Create two 1/1 colorless Thopter artifact creature tokens with flying.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{5}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 2 },
      resolve: null,
      text: "{5}, {T}, Sacrifice this land: Create two 1/1 colorless Thopter artifact creature tokens with flying.",
    },
  ],
});
