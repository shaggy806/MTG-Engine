import { EVERY_CREATURE_TYPE } from "../../subtypes.js";
import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 5724.
//
// Rulings:
//   [2024-11-08] Soulstone Sanctuary's last ability doesn't have a duration. Once it resolves, it
//     will remain in effect until the game ends, Soulstone Sanctuary leaves the battlefield, or
//     some subsequent effect changes its characteristics, whichever comes first.
//   [2024-11-08] If this becomes a creature but you haven't controlled it continuously since your
//     most recent turn began, you won't be able to activate its mana ability or attack with it
//     that turn.

const ANIMATE_TEXT = "{4}: This land becomes a 3/3 creature with vigilance and all creature types. It's still a land.";

export default defineCard({
  name: "Soulstone Sanctuary",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${ANIMATE_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{4}", tap: false },
      targets: [],
      // No duration (the ruling): it lasts until it leaves the battlefield.
      effect: {
        kind: "animate",
        target: "source",
        power: 3,
        toughness: 3,
        addTypes: ["creature"],
        addSubtypes: [EVERY_CREATURE_TYPE],
        keywords: ["vigilance"],
        duration: "permanent",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
});
