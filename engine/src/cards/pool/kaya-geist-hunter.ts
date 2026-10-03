import { defineCard } from "../define.js";

const PLUS_TEXT =
  "+1: Creatures you control gain deathtouch until end of turn. Put a +1/+1 counter on up to one target creature " +
  "token you control.";
const MINUS_TEXT =
  "−2: Until end of turn, if one or more tokens would be created under your control, twice that many of those " +
  "tokens are created instead.";
const ULTIMATE_TEXT =
  "−6: Exile all cards from all graveyards, then create a 1/1 white Spirit creature token with flying for each " +
  "card exiled this way.";

// The −2 is a doubler for the rest of the turn (a `player-effect`), the
// extra tokens exact copies of the ones being made (the ruling), and it
// compounds with a Doubling Season as two of those would.
export default defineCard({
  name: "Kaya, Geist Hunter",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Kaya"],
  loyalty: 3,
  text: `${PLUS_TEXT}\n${MINUS_TEXT}\n${ULTIMATE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false },
      loyaltyCost: 1,
      targets: [
        {
          kind: "optional",
          of: { kind: "permanent", whose: "you", filter: { type: "creature", token: true } },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "deathtouch",
            duration: "end-of-turn",
          },
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      cost: { mana: null, tap: false },
      loyaltyCost: -2,
      targets: [],
      effect: { kind: "player-effect", duration: "end-of-turn", tokenMultiplier: 2 },
      resolve: null,
      text: MINUS_TEXT,
    },
    {
      cost: { mana: null, tap: false },
      loyaltyCost: -6,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile-graveyard", target: "each-player" },
          { kind: "create-token", token: "Spirit Token", count: { thisWay: "exiled" } },
        ],
      },
      resolve: null,
      text: ULTIMATE_TEXT,
    },
  ],
});
