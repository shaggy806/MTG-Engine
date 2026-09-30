import { defineCard } from "../define.js";

const MANA_TEXT = "Whenever you tap a Forest for mana, add an additional {G}.";
const PLUS_TEXT =
  "+1: Put three +1/+1 counters on up to one target noncreature land you control. Untap it. It becomes a 0/0 Elemental creature with vigilance and haste that's still a land.";
const ULT_TEXT =
  '−8: You get an emblem with "Lands you control have indestructible." Search your library for any number of Forest cards, put them onto the battlefield tapped, then shuffle.';

// The Forest ability is a triggered mana ability (rule 605.1b), like Crypt
// Ghast's. The animated land stays a creature for good.
export default defineCard({
  name: "Nissa, Who Shakes the World",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Nissa"],
  loyalty: 5,
  text: `${MANA_TEXT}\n${PLUS_TEXT}\n${ULT_TEXT}`,
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "you-control", filter: { subtype: "Forest" } },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [
        {
          kind: "optional",
          of: { kind: "permanent", whose: "you", filter: { type: "land", notTypes: ["creature"] } },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 3 },
          { kind: "untap", target: 0 },
          {
            kind: "animate",
            target: 0,
            power: 0,
            toughness: 0,
            addTypes: ["creature"],
            addSubtypes: ["Elemental"],
            keywords: ["vigilance", "haste"],
            duration: "permanent",
          },
        ],
      },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -8,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "create-emblem",
            text: "Lands you control have indestructible.",
            static: {
              affects: { scope: "filter", filter: { type: "land", controlledBy: "you" } },
              grantKeywords: ["indestructible"],
              text: "Lands you control have indestructible.",
            },
          },
          {
            kind: "search-library",
            filter: { subtype: "Forest" },
            destination: "battlefield",
            enterTapped: true,
            min: 0,
            max: { librarySize: "you" },
          },
        ],
      },
      resolve: null,
      text: ULT_TEXT,
    },
  ],
});
