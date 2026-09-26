import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 20068.
// Makes Hero → new token "Hero Token" (scaffolded).

export default defineCard({
  name: "Pet Avengers",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dragon", "Cat", "Dog", "Bird", "Frog", "Hero"],
  power: 4,
  toughness: 4,
  keywords: ["reach"],
  text: "Reach\nPower-up — {6}{G}: Put a +1/+1 counter on this creature and create a 3/2 white Hero creature token with vigilance. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
  activated: [
    powerUp(
      "{6}{G}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 }, { kind: "create-token", token: "Hero Token", count: 1 }] },
      "Power-up — {6}{G}: Put a +1/+1 counter on this creature and create a 3/2 white Hero creature token with vigilance. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
    ),
  ],
});
