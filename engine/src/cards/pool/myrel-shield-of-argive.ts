import { defineCard } from "../define.js";

// #314 in top-commanders.txt.
//
// A `prohibits` static timed by your turn: it bars casting any spell and
// activating any ability (mana abilities included) of those permanents.
const PROHIBIT_TEXT =
  "During your turn, your opponents can't cast spells or activate abilities of artifacts, creatures, or enchantments.";
const ATTACK_TEXT =
  "Whenever Myrel attacks, create X 1/1 colorless Soldier artifact creature tokens, where X is the " +
  "number of Soldiers you control.";

export default defineCard({
  name: "Myrel, Shield of Argive",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 4,
  text: `${PROHIBIT_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      prohibits: {
        who: "opponents",
        spells: true,
        abilitiesOf: { typesAnyOf: ["artifact", "creature", "enchantment"] },
      },
      text: PROHIBIT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Soldier Artifact Token",
        count: { countOf: { subtype: "Soldier", controlledBy: "you" } },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
