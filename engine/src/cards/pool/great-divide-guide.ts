import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 2778.
//
// Rulings:
//   [2025-10-02] The Great Divide Guide is an Ally and gives its granted ability to itself.
// Chromatic Lantern's grant over a filter scope — every land and every Ally
// you control, this creature included (no `excludeSelf`).
const GRANT_TEXT = 'Each land and Ally you control has "{T}: Add one mana of any color."';

export default defineCard({
  name: "Great Divide Guide",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Scout", "Ally"],
  power: 2,
  toughness: 3,
  text: GRANT_TEXT,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { controlledBy: "you", anyOf: [{ type: "land" }, { subtype: "Ally" }] },
      },
      grantsActivated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
      text: GRANT_TEXT,
    },
  ],
});
