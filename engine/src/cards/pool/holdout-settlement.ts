import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Holdout Settlement",
  types: ["land"],
  text:
    "{T}: Add {C}.\n" +
    "{T}, Tap an untapped creature you control: Add one mana of any color.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" } },
      },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Tap an untapped creature you control: Add one mana of any color.",
    },
  ],
});
