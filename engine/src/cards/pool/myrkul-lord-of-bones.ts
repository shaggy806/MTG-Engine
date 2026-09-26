import { defineCard } from "../define.js";

// #356 in top-commanders.txt.
//
// "You may exile it. If you do": the card the creature became, while it's
// still that card in the graveyard it went to (rule 400.7). "A copy of that
// card" is of the card, not of the creature as it last existed on the
// battlefield (its ruling) — a Clone that died copying something is copied as
// a Clone. "An enchantment and loses all other card types" is part of the
// copy's copiable values (rule 707.9b), and takes the subtypes that went with
// those types (rule 205.1a): a copy of a Bear card is no Bear.
const INDESTRUCTIBLE_TEXT =
  "As long as your life total is less than or equal to half your starting life total, Myrkul has indestructible.";
const DIES_TEXT =
  "Whenever another nontoken creature you control dies, you may exile it. If you do, create a token that's a copy " +
  "of that card, except it's an enchantment and loses all other card types.";

export default defineCard({
  name: "Myrkul, Lord of Bones",
  manaCost: "{4}{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 7,
  toughness: 5,
  text: `${INDESTRUCTIBLE_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "life-total", atMost: "half-starting" },
      grantKeywords: ["indestructible"],
      text: INDESTRUCTIBLE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", otherOnly: true, filter: { type: "creature", token: false } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Exile it and create an enchantment copy of that card?",
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
                asCard: true,
                exceptions: { setTypes: ["enchantment"] },
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
