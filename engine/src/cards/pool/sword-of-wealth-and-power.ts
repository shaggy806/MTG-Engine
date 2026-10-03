import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const STATIC_TEXT = "Equipped creature gets +2/+2 and has protection from instants and from sorceries.";
const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, create a Treasure token. When you next cast " +
  "an instant or sorcery spell this turn, copy that spell. You may choose new targets for the copy.";
const NEXT_SPELL_TEXT =
  "When you next cast an instant or sorcery spell this turn, copy that spell. You may choose new targets for the copy.";

// Protection from instants and from sorceries is protection from those card
// types (rule 702.16): no instant or sorcery spell targets the creature, and
// their damage to it is prevented. The copy is made of the next instant or
// sorcery cast this turn even if it's countered in response, as it last was
// on the stack, and isn't cast.
export default defineCard({
  name: "Sword of Wealth and Power",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\n${DAMAGE_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      protection: { types: ["instant", "sorcery"] },
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Treasure Token", count: 1 },
          {
            kind: "delayed-trigger",
            at: { nextSpell: { typesAnyOf: ["instant", "sorcery"] } },
            effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
            text: NEXT_SPELL_TEXT,
          },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
