import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 16822.
// Makes Robot Villain → new token "Robot Villain Token" (scaffolded).

export default defineCard({
  name: "Ultron Drone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Villain"],
  power: 2,
  toughness: 3,
  text: "Power-up — {6}: Put two +1/+1 counters on this creature and create a 2/2 colorless Robot Villain artifact creature token. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
  activated: [
    powerUp(
      "{6}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 }, { kind: "create-token", token: "Robot Villain Token", count: 1 }] },
      "Power-up — {6}: Put two +1/+1 counters on this creature and create a 2/2 colorless Robot Villain artifact creature token. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
    ),
  ],
});
