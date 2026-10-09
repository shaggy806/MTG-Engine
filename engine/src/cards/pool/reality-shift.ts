import { defineCard } from "../define.js";

// Temur Roar (TDC). The exile and the manifest are one instruction each, in
// order: "its controller" is the exiled creature's, read as it last existed
// (rule 608.2h), who manifests from their own library (701.40a) — a 2/2 face
// down, turned face up for its mana cost if it's a creature card (701.40b).
export default defineCard({
  name: "Reality Shift",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Exile target creature. Its controller manifests the top card of their library. (That player puts the top card of their library onto the battlefield face down as a 2/2 creature. If it's a creature card, it can be turned face up any time for its mana cost.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      { kind: "manifest", who: { controllerOfTarget: 0 } },
    ],
  },
});
