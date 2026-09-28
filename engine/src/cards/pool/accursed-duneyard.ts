import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const REGEN_TEXT =
  "{2}, {T}: Regenerate target Shade, Skeleton, Specter, Spirit, Vampire, Wraith, or Zombie. " +
  "(The next time it would be destroyed this turn, instead tap it, remove it from combat, and remove all damage from it.)";

export default defineCard({
  name: "Accursed Duneyard",
  types: ["land"],
  text: `{T}: Add {C}.\n${REGEN_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{2}", tap: true },
      targets: [
        {
          kind: "permanent",
          filter: { subtypes: ["Shade", "Skeleton", "Specter", "Spirit", "Vampire", "Wraith", "Zombie"] },
        },
      ],
      effect: { kind: "regenerate", target: 0 },
      resolve: null,
      text: REGEN_TEXT,
    },
  ],
});
