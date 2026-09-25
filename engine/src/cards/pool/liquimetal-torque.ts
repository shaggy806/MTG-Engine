import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Liquimetal Torque",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {C}.\n{T}: Target nonland permanent becomes an artifact in addition to its other types until end of turn.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: ["nonland-permanent"],
      effect: { kind: "add-types", target: 0, addTypes: ["artifact"], duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target nonland permanent becomes an artifact in addition to its other types until end of turn.",
    },
  ],
});
