import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 23760.

export default defineCard({
  name: "Hercules, Prince of Power",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demigod", "Warrior", "Hero"],
  power: 3,
  toughness: 3,
  text: "Power-up — {4}{G}: Put a +1/+1 counter on Hercules. He gains vigilance, indestructible, and haste until end of turn. (Activate each power-up ability only once. Reduce the cost by his mana cost if he entered this turn.)",
  activated: [
    powerUp(
      "{4}{G}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 }, { kind: "grant-keyword", target: "source", keyword: "vigilance", duration: "end-of-turn" }, { kind: "grant-keyword", target: "source", keyword: "indestructible", duration: "end-of-turn" }, { kind: "grant-keyword", target: "source", keyword: "haste", duration: "end-of-turn" }] },
      "Power-up — {4}{G}: Put a +1/+1 counter on Hercules. He gains vigilance, indestructible, and haste until end of turn. (Activate each power-up ability only once. Reduce the cost by his mana cost if he entered this turn.)",
    ),
  ],
});
