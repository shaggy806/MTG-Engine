import { defineCard } from "../define.js";

// X is counted as the upkeep ability resolves (its ruling). "Except it's a
// 4/4 black Zombie" sets the copy's base P/T and colour and makes Zombie its
// only creature type (rule 205.1a), a copiable value (rule 707.9b). The
// delayed return finds the card only while it's still the one that died, in
// its owner's graveyard (rule 400.7 — its ruling).
const UPKEEP_TEXT =
  "At the beginning of your upkeep, each opponent loses X life and you scry X, where X is the number of Zombies " +
  "you control.";
const REANIMATE_TEXT =
  "{2}{U}{B}: Exile target creature card from a graveyard. Create a token that's a copy of it, except it's a 4/4 " +
  "black Zombie.";
const DIES_TEXT = "When The Scarab God dies, return it to its owner's hand at the beginning of the next end step.";
const ZOMBIES = { countOf: { subtype: "Zombie", controlledBy: "you" } } as const;

export default defineCard({
  name: "The Scarab God",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 5,
  toughness: 5,
  text: `${UPKEEP_TEXT}\n${REANIMATE_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: ZOMBIES, who: "each-opponent" },
          { kind: "scry", amount: ZOMBIES },
        ],
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: "next-end-step",
        effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
        text: "Return The Scarab God to its owner's hand.",
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{U}{B}", tap: false },
      targets: [{ kind: "card-in-graveyard", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          {
            kind: "create-token-copy",
            of: 0,
            count: 1,
            who: "you",
            exceptions: { basePt: [4, 4], setColors: ["B"], setSubtypes: ["Zombie"] },
          },
        ],
      },
      resolve: null,
      text: REANIMATE_TEXT,
    },
  ],
});
