import type { ActivatedAbility } from "../../abilities.js";
import { ward } from "../helpers.js";
import { defineCard } from "../define.js";

// #164 in top-commanders.txt.
//
// "A Spider you controlled" is the damage's source as it was when it dealt
// the damage — whose it was then, and a Spider then (`damagedThisTurnBy`).
// The token copies the creature as it last existed on the battlefield (rule
// 608.2h, its ruling), and is a Food artifact with the Food ability and no
// other card type or subtype (its ruling) — exceptions that are part of its
// copiable values (rule 707.9b).
const SPIDERS_TEXT = "Other Spiders you control have deathtouch and ward {2}.";
const FOOD_TEXT = "{2}, {T}, Sacrifice this token: You gain 3 life.";
const DIES_TEXT =
  "Whenever another creature dealt damage this turn by a Spider you controlled dies, create a token that's a " +
  `copy of that creature, except it's a Food artifact with "${FOOD_TEXT.slice(0, -1)}," and it loses all other ` +
  "card types.";

const FOOD: ActivatedAbility = {
  cost: { mana: "{2}", tap: true, sacrifice: "self" },
  targets: [],
  effect: { kind: "gain-life", amount: 3 },
  resolve: null,
  text: FOOD_TEXT,
};

export default defineCard({
  name: "Shelob, Child of Ungoliant",
  manaCost: "{4}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spider", "Demon"],
  power: 8,
  toughness: 8,
  keywords: ["deathtouch"],
  text: `Deathtouch, ward {2}\n${SPIDERS_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Spider", controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["deathtouch"],
      grantsTriggered: [ward({ mana: "{2}" })],
      text: SPIDERS_TEXT,
    },
  ],
  triggered: [
    ward({ mana: "{2}" }),
    {
      trigger: {
        on: "dies",
        who: "any",
        otherOnly: true,
        filter: { type: "creature", damagedThisTurnBy: { subtype: "Spider", controlledBy: "you" } },
      },
      targets: [],
      effect: {
        kind: "create-token-copy",
        of: "trigger-object",
        count: 1,
        who: "you",
        exceptions: { setTypes: ["artifact"], setSubtypes: ["Food"], activated: [FOOD] },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
