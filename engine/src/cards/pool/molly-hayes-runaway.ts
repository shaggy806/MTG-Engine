import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 25608.

export default defineCard({
  name: "Molly Hayes, Runaway",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Hero"],
  power: 3,
  toughness: 3,
  text: "Power-up — {5}{R}: Put two +1/+1 counters on Molly Hayes. Exile the top card of your library. Until the end of your next turn, you may play that card. (Activate each power-up ability only once. Reduce the cost by her mana cost if she entered this turn.)",
  activated: [
    powerUp(
      "{5}{R}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 }, { kind: "impulse-exile", amount: 1, duration: "your-next-turn" }] },
      "Power-up — {5}{R}: Put two +1/+1 counters on Molly Hayes. Exile the top card of your library. Until the end of your next turn, you may play that card. (Activate each power-up ability only once. Reduce the cost by her mana cost if she entered this turn.)",
    ),
  ],
});
