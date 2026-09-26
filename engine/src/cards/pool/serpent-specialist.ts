import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 17701.

export default defineCard({
  name: "Serpent Specialist",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Snake", "Villain"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch\nPower-up — {3}{G}: Put two +1/+1 counters on this creature. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
  activated: [
    powerUp(
      "{3}{G}",
      { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      "Power-up — {3}{G}: Put two +1/+1 counters on this creature. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
    ),
  ],
});
