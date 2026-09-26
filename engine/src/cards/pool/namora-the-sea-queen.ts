import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 25195.
// Makes Merfolk → new token "Merfolk Token" (scaffolded).

export default defineCard({
  name: "Namora, the Sea Queen",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Merfolk", "Hero"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nPower-up — {5}{U}: Put a +1/+1 counter on Namora. Create two 1/1 blue Merfolk creature tokens. (Activate each power-up ability only once. Reduce the cost by her mana cost if she entered this turn.)",
  activated: [
    powerUp(
      "{5}{U}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 }, { kind: "create-token", token: "Merfolk Token", count: 2 }] },
      "Power-up — {5}{U}: Put a +1/+1 counter on Namora. Create two 1/1 blue Merfolk creature tokens. (Activate each power-up ability only once. Reduce the cost by her mana cost if she entered this turn.)",
    ),
  ],
});
