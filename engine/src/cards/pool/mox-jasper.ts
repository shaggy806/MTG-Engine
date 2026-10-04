import { defineCard } from "../define.js";

// EDHREC rank 2532.

export default defineCard({
  name: "Mox Jasper",
  manaCost: "{0}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: "{T}: Add one mana of any color. Activate only if you control a Dragon.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      condition: { kind: "controls", filter: { subtype: "Dragon" }, atLeast: 1 },
      text: "{T}: Add one mana of any color. Activate only if you control a Dragon.",
    },
  ],
});
