import { defineCard } from "../define.js";

// #341 in top-commanders.txt.
//
// Phaeron is batched: once per simultaneous move of one or more artifact
// cards out of your graveyard.
const PHAERON_TEXT =
  "Phaeron — Whenever one or more artifact cards leave your graveyard, create two 2/2 black Necron " +
  "Warrior artifact creature tokens.";
const STRATEGIST_TEXT =
  "Grand Strategist — At the beginning of combat on your turn, another target artifact creature you " +
  "control gets +2/+2 and gains menace until end of turn.";

export default defineCard({
  name: "Imotekh the Stormlord",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Necron"],
  power: 3,
  toughness: 3,
  text: `${PHAERON_TEXT}\n${STRATEGIST_TEXT}`,
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "create-token", token: "Necron Warrior Token", count: 2 },
      resolve: null,
      text: PHAERON_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [
        { kind: "other", of: { kind: "permanent", whose: "you", filter: { types: ["artifact", "creature"] } } },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "menace", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: STRATEGIST_TEXT,
    },
  ],
});
