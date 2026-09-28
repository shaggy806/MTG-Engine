import { defineCard } from "../define.js";

/**
 * The −2 is the `cast-now` effect: the card is cast by the ordinary rules
 * (its modes, X, kicker, targets and mana cost), timing ignored, and exiled
 * instead of going to the graveyard afterwards.
 */
const MINUS_TWO_TEXT =
  "[−2]: You may cast target instant or sorcery card with mana value 3 or less from your " +
  "graveyard. If that spell would be put into your graveyard, exile it instead.";
export default defineCard({
  name: "Chandra, Acolyte of Flame",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Chandra"],
  loyalty: 4,
  text:
    "[0]: Put a loyalty counter on each red planeswalker you control.\n" +
    "[0]: Create two 1/1 red Elemental creature tokens. They gain haste. " +
    "Sacrifice them at the beginning of the next end step.\n" +
    MINUS_TWO_TEXT,
  activated: [
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "planeswalker", colors: ["R"], controlledBy: "you" },
        counter: "loyalty",
        amount: 1,
      },
      resolve: null,
      text: "[0]: Put a loyalty counter on each red planeswalker you control.",
    },
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Elemental Token",
        count: 2,
        sacrificeAtEndStep: true,
      },
      resolve: null,
      text:
        "[0]: Create two 1/1 red Elemental creature tokens. They gain haste. " +
        "Sacrifice them at the beginning of the next end step.",
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { typesAnyOf: ["instant", "sorcery"], manaValue: { op: "lte", n: 3 } },
        },
      ],
      effect: { kind: "cast-now", target: 0, exileAfter: true },
      resolve: null,
      text: MINUS_TWO_TEXT,
    },
  ],
});
