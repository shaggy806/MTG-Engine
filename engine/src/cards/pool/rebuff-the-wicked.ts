import { defineCard } from "../define.js";

// The rulings this follows: a spell with several targets qualifies if one of
// them is a permanent you control. If that permanent leaves the battlefield
// (or you stop controlling it), the spell is no longer a legal target, and
// Rebuff the Wicked doesn't resolve; if it merely became an illegal target
// for that spell, the spell still targets it, and can still be countered.
export default defineCard({
  name: "Rebuff the Wicked",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Counter target spell that targets a permanent you control.",
  targets: [{ kind: "spell", filter: { targets: { permanent: { controlledBy: "you" } } } }],
  effect: { kind: "counter", target: 0 },
});
