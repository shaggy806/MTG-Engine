import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 19294.

export default defineCard({
  name: "Aerial Doombot",
  manaCost: "{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Villain"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nPower-up — {5}{U}: Put three +1/+1 counters on this creature. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
  activated: [
    powerUp(
      "{5}{U}",
      { kind: "add-counter", target: "source", counter: "+1/+1", amount: 3 },
      "Power-up — {5}{U}: Put three +1/+1 counters on this creature. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
    ),
  ],
});
