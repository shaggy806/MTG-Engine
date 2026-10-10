import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 3333. The last ability is crew's effect without crew's cost:
// the Vehicle doesn't become crewed.
const RESTRICTED = "{T}: Add one mana of any color. Spend this mana only to cast a Pilot or Vehicle spell.";
const ANIMATE = "{3}, {T}: Target Vehicle becomes an artifact creature until end of turn.";

export default defineCard({
  name: "Mech Hangar",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${RESTRICTED}\n${ANIMATE}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { anyOf: [{ subtype: "Pilot" }, { subtype: "Vehicle" }] },
          text: "Spend this mana only to cast a Pilot or Vehicle spell.",
        },
      },
      resolve: null,
      text: RESTRICTED,
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [{ kind: "permanent", filter: { subtype: "Vehicle" } }],
      effect: { kind: "add-types", target: 0, addTypes: ["artifact", "creature"], duration: "end-of-turn" },
      resolve: null,
      text: ANIMATE,
    },
  ],
});
