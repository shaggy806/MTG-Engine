import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 2878.

const PUMP_TEXT =
  "{2}, {T}: Target creature gets +X/+X until end of turn, where X is the number of Gates you control. Activate only as a sorcery.";

export default defineCard({
  name: "Basilisk Gate",
  colors: [],
  types: ["land"],
  subtypes: ["Gate"],
  text: `{T}: Add {C}.\n${PUMP_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{2}", tap: true },
      targets: ["creature"],
      effect: {
        kind: "modify-pt",
        target: 0,
        power: { countOf: { subtype: "Gate", controlledBy: "you" } },
        toughness: { countOf: { subtype: "Gate", controlledBy: "you" } },
        duration: "end-of-turn",
      },
      resolve: null,
      text: PUMP_TEXT,
      sorcerySpeed: true,
    },
  ],
});
