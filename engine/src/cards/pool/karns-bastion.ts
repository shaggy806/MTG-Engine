import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Karn's Bastion",
  types: ["land"],
  text: "{T}: Add {C}.\n{4}, {T}: Proliferate.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "{4}, {T}: Proliferate.",
    },
  ],
});
