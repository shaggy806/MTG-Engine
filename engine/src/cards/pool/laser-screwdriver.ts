import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 6633.

const TAP_TEXT = "{1}, {T}: Tap target artifact.";
const SURVEIL_TEXT = "{2}, {T}: Surveil 1. (Look at the top card of your library. You may put that card into your graveyard.)";
const GOAD_TEXT =
  "{3}, {T}: Goad target creature. (Until your next turn, it attacks each combat if able and attacks a player other than you if able.)";

export default defineCard({
  name: "Laser Screwdriver",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: `{T}: Add one mana of any color.\n${TAP_TEXT}\n${SURVEIL_TEXT}\n${GOAD_TEXT}`,
  activated: [
    addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
    {
      cost: { mana: "{1}", tap: true },
      targets: ["artifact"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: TAP_TEXT,
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: SURVEIL_TEXT,
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "goad", target: 0 },
      resolve: null,
      text: GOAD_TEXT,
    },
  ],
});
