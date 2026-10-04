import { defineCard } from "../define.js";

// EDHREC rank 6218.
//
// Steel-Plume Marshal's "other attacking creatures you control" pump, with
// Overrun's trample grant and Combat Celebrant's untap, each sparing Tori.
const TEXT =
  "Whenever Tori D'Avenant attacks, all other attacking creatures you control get +1/+1 until end of turn. Other red attacking creatures you control gain trample until end of turn. Untap each other white attacking creature you control.";

export default defineCard({
  name: "Tori D'Avenant, Fury Rider",
  manaCost: "{1}{R}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance", "trample"],
  text: `Vigilance, trample\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "modify-pt-all",
            filter: { type: "creature", controlledBy: "you", attacking: true },
            power: 1,
            toughness: 1,
            duration: "end-of-turn",
            exceptSource: true,
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you", attacking: true, colors: ["R"] },
            keyword: "trample",
            duration: "end-of-turn",
            exceptSource: true,
          },
          {
            kind: "untap-all",
            filter: { type: "creature", controlledBy: "you", attacking: true, colors: ["W"] },
            exceptSource: true,
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
