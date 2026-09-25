import { defineCard } from "../define.js";

// #137 in top-commanders.txt.
//
// "If another Human entered the battlefield under your control this turn" is
// the intervening-if (`turn-history`, `excludeSelf`), asked as combat begins
// and again on resolution. The six-Humans check comes after the Knights are
// made, so they count.
const TRIGGER_TEXT =
  "At the beginning of combat on your turn, if another Human entered the battlefield under your " +
  "control this turn, create two 2/2 red Human Knight creature tokens with trample and haste. " +
  "Then if you control six or more Humans, draw a card.";

export default defineCard({
  name: "Éowyn, Shieldmaiden",
  manaCost: "{2}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 5,
  toughness: 4,
  keywords: ["first-strike"],
  text: `First strike\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: { kind: "turn-history", what: "entered", filter: { subtype: "Human" }, excludeSelf: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Human Knight Token", count: 2 },
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { subtype: "Human" }, atLeast: 6 },
            then: { kind: "draw", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
