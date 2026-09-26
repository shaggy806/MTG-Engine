import { defineCard } from "../define.js";

const SWAMPS = { product: [{ countOf: { subtype: "Swamp", controlledBy: "you" } }, -1] } as const;

// Counted as it resolves — any permanent of yours that's a Swamp, a typed
// dual included.
export default defineCard({
  name: "Defile",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -1/-1 until end of turn for each Swamp you control.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: SWAMPS, toughness: SWAMPS, duration: "end-of-turn" },
});
