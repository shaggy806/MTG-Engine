import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 23084.

export default defineCard({
  name: "Goliath, Mass Manipulator",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Scientist", "Hero"],
  power: 2,
  toughness: 2,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)\nPower-up — {4}{G}: Put two +1/+1 counters on Goliath. Then draw a card for each creature you control with power 4 or greater. (Activate each power-up ability only once. Reduce the cost by his mana cost if he entered this turn.)",
  activated: [
    powerUp(
      "{4}{G}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 }, { kind: "draw", amount: { countOf: { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } } } }] },
      "Power-up — {4}{G}: Put two +1/+1 counters on Goliath. Then draw a card for each creature you control with power 4 or greater. (Activate each power-up ability only once. Reduce the cost by his mana cost if he entered this turn.)",
    ),
  ],
});
