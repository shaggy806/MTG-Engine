import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 15817.

export default defineCard({
  name: "Captain Marvel, Earth's Protector",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Kree", "Hero"],
  power: 5,
  toughness: 4,
  keywords: ["flash", "flying", "lifelink"],
  text: "Flash\nFlying, lifelink\nPower-up — {5}{W}{W}: Put a +1/+1 counter and an indestructible counter on Captain Marvel. (Activate each power-up ability only once. Reduce the cost by her mana cost if she entered this turn.)",
  activated: [
    powerUp(
      "{5}{W}{W}",
      { kind: "sequence", effects: [{ kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 }, { kind: "add-counter", target: "source", counter: "indestructible", amount: 1 }] },
      "Power-up — {5}{W}{W}: Put a +1/+1 counter and an indestructible counter on Captain Marvel. (Activate each power-up ability only once. Reduce the cost by her mana cost if she entered this turn.)",
    ),
  ],
});
