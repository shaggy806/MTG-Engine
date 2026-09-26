import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 25061.

export default defineCard({
  name: "Volcanic Villain",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Villain"],
  power: 3,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste\nPower-up — {5}{R}: Put two +1/+1 counters on this creature. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
  activated: [
    powerUp(
      "{5}{R}",
      { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      "Power-up — {5}{R}: Put two +1/+1 counters on this creature. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
    ),
  ],
});
