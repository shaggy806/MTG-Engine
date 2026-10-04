import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 6406.
//
// Rulings:
//   [2024-04-12] Desert is a land subtype with no special meaning. It doesn’t grant the land an
//     intrinsic mana ability. Other cards may care about which lands are Deserts.

export default defineCard({
  name: "Sandstorm Verge",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "{T}: Add {C}.\n{3}, {T}: Target creature can't block this turn. Activate only as a sorcery.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "restrict", target: 0, restrictions: ["cant-block"] },
      resolve: null,
      text: "{3}, {T}: Target creature can't block this turn. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
