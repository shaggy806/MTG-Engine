import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 19310.

export default defineCard({
  name: "Abomination, Terrifying Titan",
  manaCost: "{3}{R/G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Gamma", "Villain"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample\nPower-up — {5}{R/G}{R/G}: Put a +1/+1 counter on Abomination. He fights up to one target creature an opponent controls. (Activate each power-up ability only once. Reduce the cost by his mana cost if he entered this turn.)",
  activated: [
    powerUp(
      "{5}{R/G}{R/G}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 }, { kind: "fight", a: "source", b: 0 }] },
      "Power-up — {5}{R/G}{R/G}: Put a +1/+1 counter on Abomination. He fights up to one target creature an opponent controls. (Activate each power-up ability only once. Reduce the cost by his mana cost if he entered this turn.)", [{ kind: "optional", of: "creature-an-opponent-controls" }],
    ),
  ],
});
