import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const LIFE_TEXT = "{2}, {T}: You gain 1 life for each colorless creature you control.";

export default defineCard({
  name: "Tomb of the Spirit Dragon",
  types: ["land"],
  text: `{T}: Add {C}.\n${LIFE_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "gain-life",
        amount: { countOf: { type: "creature", colorless: true, controlledBy: "you" } },
      },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
});
