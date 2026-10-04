import { defineCard } from "../define.js";

// EDHREC rank 2943.
// X is the number of cards in your hand as the ability resolves, fixed from
// then on; later P/T-setting effects overwrite it (the rulings).

const DRAW_TEXT = "Whenever you draw your second card each turn, create a 2/2 green Cat creature token.";
const ANIMATE_TEXT =
  "{4}{G}{G}: Until end of turn, creatures you control have base power and toughness X/X, where X is the number of cards in your hand.";

export default defineCard({
  name: "Jolrael, Mwonvuli Recluse",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 1,
  toughness: 2,
  text: `${DRAW_TEXT}\n${ANIMATE_TEXT}`,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "2/2 Green Cat Token", count: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{G}{G}", tap: false },
      targets: [],
      effect: {
        kind: "animate-all",
        filter: { type: "creature", controlledBy: "you" },
        power: { cardsInHand: "you" },
        toughness: { cardsInHand: "you" },
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
});
