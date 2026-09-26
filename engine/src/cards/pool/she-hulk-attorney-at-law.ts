import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 24402.

export default defineCard({
  name: "She-Hulk, Attorney-at-Law",
  manaCost: "{2}{G/W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Gamma", "Advisor", "Hero"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\nPower-up — {6}{G/W}: Put a +1/+1 counter on She-Hulk. Then double the number of +1/+1 counters on each creature you control. (Activate each power-up ability only once. Reduce the cost by her mana cost if she entered this turn.)",
  activated: [
    powerUp(
      "{6}{G/W}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 }, { kind: "double-counters-all", filter: { type: "creature", controlledBy: "you" }, counterKind: "+1/+1" }] },
      "Power-up — {6}{G/W}: Put a +1/+1 counter on She-Hulk. Then double the number of +1/+1 counters on each creature you control. (Activate each power-up ability only once. Reduce the cost by her mana cost if she entered this turn.)",
    ),
  ],
});
