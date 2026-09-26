import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 24515.

export default defineCard({
  name: "Brave Brawler",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Hero"],
  power: 2,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink\nPower-up — {4}{W}: Put two +1/+1 counters on this creature. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
  activated: [
    powerUp(
      "{4}{W}",
      { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      "Power-up — {4}{W}: Put two +1/+1 counters on this creature. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
    ),
  ],
});
