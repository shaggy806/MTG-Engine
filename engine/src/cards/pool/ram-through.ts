import { defineCard } from "../define.js";

// Tramplesaurus Rex. A bite whose excess goes past the creature (rule
// 120.4a): with trample, what's beyond lethal — toughness less damage marked,
// 1 from deathtouch, ignoring prevention and indestructible (its rulings) — is
// dealt to that creature's controller instead, at the same time. Either
// target illegal and no damage is dealt (a blank source slot deals none).
// "You don't control" is an opponent's (no teams).
const TEXT =
  "Target creature you control deals damage equal to its power to target creature you don't control. If the creature you control has trample, excess damage is dealt to that creature's controller instead.";

export default defineCard({
  name: "Ram Through",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: TEXT,
  targets: ["creature-you-control", "creature-an-opponent-controls"],
  effect: {
    kind: "damage",
    amount: { powerOf: 0 },
    target: 1,
    from: { target: 0 },
    excessToController: { ifSourceHas: "trample" },
  },
});
