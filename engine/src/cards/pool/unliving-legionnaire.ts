import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 24806.

export default defineCard({
  name: "Unliving Legionnaire",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Villain"],
  power: 3,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nPower-up — {5}{B}{B}: Return up to one target creature card from your graveyard to your hand. Put two +1/+1 counters on this creature. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)",
  activated: [
    powerUp(
      "{5}{B}{B}",
      { kind: "sequence", effects: [{ kind: "return-to-hand", target: 0, from: "graveyard" }, { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 }] },
      "Power-up — {5}{B}{B}: Return up to one target creature card from your graveyard to your hand. Put two +1/+1 counters on this creature. (Activate each power-up ability only once. Reduce the cost by its mana cost if it entered this turn.)", [{ kind: "optional", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } } }],
    ),
  ],
});
