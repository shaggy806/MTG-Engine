import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 29662.

export default defineCard({
  name: "Extremis Elite",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Mercenary", "Villain"],
  power: 2,
  toughness: 2,
  text: "Power-up — {4}{R}: Put two +1/+1 counters on this creature. It deals 1 damage to any target. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
  activated: [
    powerUp(
      "{4}{R}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 }, { kind: "damage", amount: 1, target: 0 }] },
      "Power-up — {4}{R}: Put two +1/+1 counters on this creature. It deals 1 damage to any target. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)", ["any-target"],
    ),
  ],
});
