import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Nimbus Maze",
  types: ["land"],
  text:
    "{T}: Add {C}.\n" +
    "{T}: Add {W}. Activate only if you control an Island.\n" +
    "{T}: Add {U}. Activate only if you control a Plains.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { subtype: "Island" }, atLeast: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}. Activate only if you control an Island.",
    },
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { subtype: "Plains" }, atLeast: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}. Activate only if you control a Plains.",
    },
  ],
});
