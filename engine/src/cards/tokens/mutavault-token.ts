import { EVERY_CREATURE_TYPE } from "../../subtypes.js";
import { defineCard } from "../define.js";

// Mutable Explorer's Mutavault token.

export default defineCard({
  name: "Mutavault Token",
  art: "3d2f5d31-a1c6-465f-b518-b40acdfab8aa",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}: This token becomes a 2/2 creature with all creature types until end of turn. It's still a land.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 2,
        toughness: 2,
        addTypes: ["creature"],
        addSubtypes: [EVERY_CREATURE_TYPE],
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}: This token becomes a 2/2 creature with all creature types until end of turn. It's still a land.",
    },
  ],
});
