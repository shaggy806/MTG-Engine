import { defineCard } from "../define.js";

// −3: the four cards are revealed to every player; the Treasures count the
// cards this resolution put into your graveyard, once the choice is made
// (the sequence waits for it). −11: "them" is every nonland permanent, all of
// them yours by then, so untapping and hasting the nonland permanents you
// control is the same set.
const PLUS_TEXT =
  "+2: Up to one target legendary creature gains vigilance, lifelink, and indestructible until your next turn.";
const MINUS_TEXT =
  "−3: Reveal the top four cards of your library. Put any number of legendary cards from among them into your hand and the rest into your graveyard. Create a Treasure token for each card put into your graveyard this way.";
const ULT_TEXT =
  "−11: Gain control of all nonland permanents until end of turn. Untap them. They gain haste until end of turn.";

const nonland = { notTypes: ["land"] } as const;

export default defineCard({
  name: "Dihada, Binder of Wills",
  manaCost: "{1}{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Dihada"],
  loyalty: 5,
  canBeCommander: true,
  text: `${PLUS_TEXT}\n${MINUS_TEXT}\n${ULT_TEXT}\nDihada, Binder of Wills can be your commander.`,
  activated: [
    {
      loyaltyCost: 2,
      cost: { mana: null, tap: false },
      targets: [{ kind: "optional", of: { kind: "permanent", filter: { type: "creature", supertype: "legendary" } } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "vigilance", duration: "until-your-next-turn" },
          { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "until-your-next-turn" },
          { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "until-your-next-turn" },
        ],
      },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "look-and-choose",
            zone: "library",
            count: 4,
            reveal: true,
            min: 0,
            max: 4,
            filter: { supertype: "legendary" },
            destination: "hand",
            leftover: "graveyard",
          },
          {
            kind: "create-token",
            token: "Treasure Token",
            count: { thisWay: "put-into-graveyard", who: "you" },
          },
        ],
      },
      resolve: null,
      text: MINUS_TEXT,
    },
    {
      loyaltyCost: -11,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-control-all", filter: nonland, untilEndOfTurn: true },
          { kind: "untap-all", filter: { ...nonland, controlledBy: "you" } },
          { kind: "grant-keyword-all", filter: { ...nonland, controlledBy: "you" }, keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: ULT_TEXT,
    },
  ],
});
