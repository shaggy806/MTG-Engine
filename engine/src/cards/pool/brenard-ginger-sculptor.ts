import type { ActivatedAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// #291 in top-commanders.txt.
//
// "You may exile it. If you do": the card the creature became, while it's
// still that card in the graveyard it went to (rule 400.7) — a commander its
// owner has already sent to the command zone makes nothing. "A copy of that
// creature" copies it as it last existed on the battlefield (rule 608.2h), and
// the exceptions, its Food ability included, are part of the copy's copiable
// values (rule 707.9b): a copy of the token is a Food Golem too.
const ANTHEM_TEXT = "Each creature you control that's a Food or a Golem gets +2/+2 and has trample.";
const FOOD_TEXT = "{2}, {T}, Sacrifice this token: You gain 3 life.";
const DIES_TEXT =
  "Whenever another nontoken creature you control dies, you may exile it. If you do, create a token that's a copy " +
  "of that creature, except it's a 1/1 Food Golem artifact creature in addition to its other types and it has " +
  `"${FOOD_TEXT}"`;

const FOOD: ActivatedAbility = {
  cost: { mana: "{2}", tap: true, sacrifice: "self" },
  targets: [],
  effect: { kind: "gain-life", amount: 3 },
  resolve: null,
  text: FOOD_TEXT,
};

export default defineCard({
  name: "Brenard, Ginger Sculptor",
  manaCost: "{1}{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 3,
  toughness: 3,
  text: `${ANTHEM_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", subtypes: ["Food", "Golem"] } },
      grantPt: [2, 2],
      grantKeywords: ["trample"],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", otherOnly: true, filter: { type: "creature", token: false } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Exile it and create a Food Golem copy of it?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "exile", target: "trigger-object" },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "exiled" },
              then: {
                kind: "create-token-copy",
                of: "trigger-object",
                count: 1,
                who: "you",
                exceptions: {
                  basePt: [1, 1],
                  addTypes: ["artifact", "creature"],
                  addSubtypes: ["Food", "Golem"],
                  activated: [FOOD],
                },
              },
            },
          ],
        },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
