import { defineCard } from "../define.js";
import { CHOSEN_CREATURE_TYPE, equip } from "../helpers.js";

// EDHREC rank 5311.
// The type is chosen as the trigger resolves, and the creatures of that type
// are counted then.

const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, choose a creature type. Create a Treasure token for each creature you control of that type.";

export default defineCard({
  name: "Orcrist, Goblin-cleaver",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +2/+2 and has trample.\n${DAMAGE_TEXT}\nEquip {3}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["trample"],
      text: "Equipped creature gets +2/+2 and has trample.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "choose-creature-type",
        then: {
          kind: "create-token",
          token: "Treasure Token",
          count: { countOf: { type: "creature", controlledBy: "you", subtype: CHOSEN_CREATURE_TYPE } },
        },
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
