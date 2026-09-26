import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 22288.

export default defineCard({
  name: "Gamma Grotesque",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Gamma", "Horror", "Villain"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)\nPower-up — {4}{G}{G}: Put three +1/+1 counters on this creature. Then draw a card for each creature you control with a counter on it. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
  activated: [
    powerUp(
      "{4}{G}{G}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 3 }, { kind: "draw", amount: { countOf: { type: "creature", controlledBy: "you", counters: { compare: { op: "gte", n: 1 } } } } }] },
      "Power-up — {4}{G}{G}: Put three +1/+1 counters on this creature. Then draw a card for each creature you control with a counter on it. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
    ),
  ],
});
