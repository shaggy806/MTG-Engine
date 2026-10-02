import { defineCard } from "../define.js";

// Commander backlog (top-commanders.txt). Doubling gives +X/+0, X its power
// as the landfall ability resolves (2025-06-06 ruling), so the order of
// several landfall triggers matters: a player who orders their own triggers
// is asked (the opt-in `order-triggers` decision, rule 603.3b).
const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, double Tifa Lockhart's power until end of turn.";

export default defineCard({
  name: "Tifa Lockhart",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 1,
  toughness: 2,
  keywords: ["trample"],
  text: `Trample\n${LANDFALL_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: { powerOf: "source", doubling: true },
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
