import { defineCard } from "../define.js";

const LORD_TEXT = "Other Dwarves you control get +1/+0.";
const TREASURE_TEXT = "Whenever a Dwarf you control becomes tapped, create a Treasure token.";
const SEARCH_TEXT =
  "Sacrifice five Treasures: Search your library for an artifact or Dragon card, put that card onto the battlefield, then shuffle.";

// "Becomes tapped" (rule 701.21a) fires however a Dwarf is tapped, and only
// when it actually goes from untapped to tapped (the ruling). The five
// Treasures are chosen as the cost is paid — a sacrifice of several.
export default defineCard({
  name: "Magda, Brazen Outlaw",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Berserker"],
  power: 2,
  toughness: 1,
  text: `${LORD_TEXT}\n${TREASURE_TEXT}\n${SEARCH_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Dwarf" },
      grantPt: [1, 0],
      text: LORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "becomes-tapped", who: "you-control", filter: { subtype: "Dwarf" } },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Treasure" }, count: 5 } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { anyOf: [{ type: "artifact" }, { subtype: "Dragon" }] },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
