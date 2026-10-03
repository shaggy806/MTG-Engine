import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const BEACON_TEXT = "{T}, Sacrifice this land: Put your commander into your hand from the command zone.";

// One of your choice with two commanders there (the ruling); with none
// there as it resolves, nothing happens. Cast from the hand later, it pays
// no commander tax and adds none (the rulings — tax is a command-zone cast's).
export default defineCard({
  name: "Command Beacon",
  types: ["land"],
  colors: [],
  text: `{T}: Add {C}.\n${BEACON_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "command",
        min: 1,
        max: 1,
        destination: "hand",
        leftover: "stay",
      },
      resolve: null,
      text: BEACON_TEXT,
    },
  ],
});
