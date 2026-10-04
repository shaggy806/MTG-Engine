import { defineCard } from "../define.js";

// EDHREC rank 2512.
//
// X is the hand as the last ability resolves, locked in (rule 608.2h; the
// ruling) — `modify-pt-all` reads its amount once. Alandra gets it once even
// if she's a Drake herself: the Drakes' half spares the source.
//
// Rulings:
//   [2022-12-02] The first triggered ability can trigger only once each turn. It doesn't matter
//     whether Alandra, Sky Dreamer was on the battlefield when the first card was drawn. If it's
//     not on the battlefield when the second card is drawn, the ability can't trigger at all that
//     turn. It won't trigger when the third or fourth card is drawn.
//   [2022-12-02] The same is true for the last ability and the fifth card drawn.
//   [2022-12-02] The value of X is locked in as the last ability resolves. The bonus it grants
//     won't change after that point, even if the number of cards in your hand does.

const DRAKE_TEXT = "Whenever you draw your second card each turn, create a 2/2 blue Drake creature token with flying.";
const PUMP_TEXT =
  "Whenever you draw your fifth card each turn, Alandra and Drakes you control each get +X/+X until end of turn, where X is the number of cards in your hand.";
const HAND = { cardsInHand: "you" } as const;

export default defineCard({
  name: "Alandra, Sky Dreamer",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 2,
  toughness: 4,
  text: `${DRAKE_TEXT}\n${PUMP_TEXT}`,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Drake Token", count: 1 },
      resolve: null,
      text: DRAKE_TEXT,
    },
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 5 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: "source", power: HAND, toughness: HAND, duration: "end-of-turn" },
          {
            kind: "modify-pt-all",
            filter: { subtype: "Drake", controlledBy: "you" },
            power: HAND,
            toughness: HAND,
            duration: "end-of-turn",
            exceptSource: true,
          },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
