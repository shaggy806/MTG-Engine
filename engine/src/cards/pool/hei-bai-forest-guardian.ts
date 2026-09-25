import { defineCard } from "../define.js";

// #412 in top-commanders.txt.
const ENTER_TEXT =
  "When Hei Bai enters, reveal cards from the top of your library until you reveal a Shrine card. You " +
  "may put that card onto the battlefield. Then shuffle.";
const SPIRIT_TEXT =
  "{W}{U}{B}{R}{G}, {T}: For each legendary enchantment you control, create a 1/1 colorless Spirit " +
  'creature token with "This token can\'t block or be blocked by non-Spirit creatures."';

export default defineCard({
  name: "Hei Bai, Forest Guardian",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bear", "Spirit"],
  power: 4,
  toughness: 4,
  text: `${ENTER_TEXT}\n${SPIRIT_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "reveal-until",
        filter: { subtype: "Shrine" },
        then: {
          kind: "may",
          prompt: "Put the Shrine onto the battlefield?",
          effect: { kind: "put-onto-battlefield", target: 0 },
        },
        rest: "shuffle",
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{W}{U}{B}{R}{G}", tap: true },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Spirit Token (Colorless, Evasive)",
        count: { countOf: { type: "enchantment", supertype: "legendary", controlledBy: "you" } },
      },
      resolve: null,
      text: SPIRIT_TEXT,
    },
  ],
});
