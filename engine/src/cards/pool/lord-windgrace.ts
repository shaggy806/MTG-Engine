import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

// #256 in top-commanders.txt.
//
// - +2: the extra draw asks what the discard step did (`this-way`), after
//   the discard has been chosen.
// - −3 and −11 are single instructions over several targets, so what they
//   move moves at once (`simultaneous`).
const PLUS_TEXT =
  "+2: Discard a card, then draw a card. If a land card is discarded this way, draw an additional card.";
const MINUS3_TEXT = "−3: Return up to two target land cards from your graveyard to the battlefield.";
const MINUS11_TEXT =
  "−11: Destroy up to six target nonland permanents, then create six 2/2 green Cat Warrior " +
  "creature tokens with forestwalk.";
const landCard: TargetSpec = { kind: "optional", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "land" } } };
const nonland: TargetSpec = { kind: "optional", of: "nonland-permanent" };
const SIX = [0, 1, 2, 3, 4, 5] as const;

export default defineCard({
  name: "Lord Windgrace",
  manaCost: "{2}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Windgrace"],
  loyalty: 5,
  text: `${PLUS_TEXT}\n${MINUS3_TEXT}\n${MINUS11_TEXT}\nLord Windgrace can be your commander.`,
  activated: [
    {
      loyaltyCost: 2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "discard", target: "you", amount: 1 },
          { kind: "draw", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "discarded", filter: { type: "land" } },
            then: { kind: "draw", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [landCard, landCard],
      effect: {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          { kind: "put-onto-battlefield", target: 1 },
        ],
      },
      resolve: null,
      text: MINUS3_TEXT,
    },
    {
      loyaltyCost: -11,
      cost: { mana: null, tap: false },
      targets: SIX.map(() => nonland),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "sequence", simultaneous: true, effects: SIX.map((i) => ({ kind: "destroy" as const, target: i })) },
          { kind: "create-token", token: "Cat Warrior Token", count: 6 },
        ],
      },
      resolve: null,
      text: MINUS11_TEXT,
    },
  ],
});
