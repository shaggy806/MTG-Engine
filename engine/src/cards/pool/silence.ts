import { defineCard } from "../define.js";

export default defineCard({
  name: "Silence",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Your opponents can't cast spells this turn.",
  effect: { kind: "prohibit", who: "each-opponent", spells: true },
});
