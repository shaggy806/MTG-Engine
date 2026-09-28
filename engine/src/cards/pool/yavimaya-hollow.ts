import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const REGEN_TEXT = "{G}, {T}: Regenerate target creature.";

export default defineCard({
  name: "Yavimaya Hollow",
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {C}.\n${REGEN_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "regenerate", target: 0 },
      resolve: null,
      text: REGEN_TEXT,
    },
  ],
});
