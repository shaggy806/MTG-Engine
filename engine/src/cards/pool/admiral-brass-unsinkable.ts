import { defineCard } from "../define.js";

const MILL_TEXT = "When Admiral Brass enters, mill four cards.";
const COMBAT_TEXT =
  "At the beginning of combat on your turn, you may return target Pirate creature card from " +
  "your graveyard to the battlefield with a finality counter on it. It has base power and " +
  "toughness 4/4. It gains haste until end of turn.";

// The Lost Caverns of Ixalan Commander. "You may return target …" is an
// optional target, the same shape Sun Titan uses: declining is choosing no
// card, and the whole sequence then does nothing.
//
// The finality counter needs no rider of its own — `moveObject` exiles any
// permanent carrying one that would go to a graveyard from the battlefield
// (rule 122). "It has base power and toughness 4/4" has no duration, so it's
// a permanent layer-7b set (an `animate` that adds nothing else), lasting
// until the creature leaves the battlefield.
export default defineCard({
  name: "Admiral Brass, Unsinkable",
  manaCost: "{2}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 3,
  toughness: 3,
  text:
    `${MILL_TEXT}\n${COMBAT_TEXT}\n` +
    "(If a creature with a finality counter on it would die, exile it instead.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 4 },
      resolve: null,
      text: MILL_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [
        {
          kind: "optional",
          of: {
            kind: "card-in-graveyard",
            whose: "you",
            filter: { type: "creature", subtype: "Pirate" },
          },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "put-onto-battlefield",
            target: 0,
            withCounters: { kind: "finality", amount: 1 },
          },
          {
            kind: "animate",
            target: 0,
            power: 4,
            toughness: 4,
            addTypes: [],
            addSubtypes: [],
            duration: "permanent",
          },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
