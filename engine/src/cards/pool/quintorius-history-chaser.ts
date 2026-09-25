import { defineCard } from "../define.js";

// #269 in top-commanders.txt.
//
// +1: "If you do" is asked of what the discard actually did (`this-way`), so
// saying yes with an empty hand draws nothing.
const LEAVE_TEXT = "Whenever one or more cards leave your graveyard, create a 3/2 red and white Spirit creature token.";
const PLUS_TEXT = "+1: You may discard a card. If you do, draw two cards, then mill a card.";
const MINUS_TEXT = "−4: Spirits you control gain double strike and vigilance until end of turn.";
const spirits = { subtype: "Spirit", controlledBy: "you" } as const;

export default defineCard({
  name: "Quintorius, History Chaser",
  manaCost: "{2}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Quintorius"],
  loyalty: 5,
  text: `${LEAVE_TEXT}\n${PLUS_TEXT}\n${MINUS_TEXT}\nQuintorius, History Chaser can be your commander.`,
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token (Red-White)", count: 1 },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Discard a card to draw two cards, then mill a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 1 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "discarded" },
              then: {
                kind: "sequence",
                effects: [
                  { kind: "draw", amount: 2 },
                  { kind: "mill", target: "you", amount: 1 },
                ],
              },
            },
          ],
        },
      },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -4,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword-all", filter: spirits, keyword: "double-strike", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: spirits, keyword: "vigilance", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: MINUS_TEXT,
    },
  ],
});
