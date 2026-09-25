import { defineCard } from "../define.js";

// A player who can't cast spells can't suspend a card either (2021-03-19
// ruling): suspend asks whether the card could be cast.
export default defineCard({
  name: "Silence",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Your opponents can't cast spells this turn.",
  effect: { kind: "prohibit", who: "each-opponent", spells: true },
});
