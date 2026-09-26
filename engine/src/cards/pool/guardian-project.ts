import { defineCard } from "../define.js";

// The intervening "if" is asked as the creature enters (the trigger's
// filter) and again as the ability resolves (the conditional, on the trigger
// object — as it last existed if it has left): a same-named creature arriving
// in between, the creature itself dying into your graveyard, or it leaving
// and coming back as a new object all stop the draw (rule 603.4, its
// rulings).
const TEXT =
  "Whenever a nontoken creature you control enters, if it doesn't have the same name as another creature you " +
  "control or a creature card in your graveyard, draw a card.";
const FIRST_OF_ITS_NAME = {
  nameUnlike: {
    others: { type: "creature", controlledBy: "you" },
    graveyard: { type: "creature", ownedBy: "you" },
  },
} as const;

export default defineCard({
  name: "Guardian Project",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { type: "creature", token: false, controlledBy: "you", ...FIRST_OF_ITS_NAME },
      },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "trigger-object", filter: FIRST_OF_ITS_NAME },
        then: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
