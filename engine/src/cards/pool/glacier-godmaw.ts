import { defineCard } from "../define.js";

// EDHREC rank 4985.
// Makes Lander → uses "Lander Token".

const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, creatures you control get +1/+1 and gain vigilance and haste until end of turn.";
const YOURS = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Glacier Godmaw",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Leviathan"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: `Trample\nWhen this creature enters, create a Lander token. (It's an artifact with "{2}, {T}, Sacrifice this token: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.")\n${LANDFALL_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Lander Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a Lander token.",
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: YOURS, power: 1, toughness: 1, duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: YOURS, keyword: "vigilance", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: YOURS, keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
