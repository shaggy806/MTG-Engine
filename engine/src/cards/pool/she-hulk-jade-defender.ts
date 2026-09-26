import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 16887.

export default defineCard({
  name: "She-Hulk, Jade Defender",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Gamma", "Hero"],
  power: 4,
  toughness: 4,
  keywords: ["reach", "trample"],
  text: "Reach, trample\nPower-up — {4}{G}{G}: Destroy up to one target artifact or enchantment. Put a +1/+1 counter on She-Hulk. (Activate each power-up ability only once. Reduce the cost by her mana cost if she entered this turn.)",
  activated: [
    powerUp(
      "{4}{G}{G}",
      { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 }] },
      "Power-up — {4}{G}{G}: Destroy up to one target artifact or enchantment. Put a +1/+1 counter on She-Hulk. (Activate each power-up ability only once. Reduce the cost by her mana cost if she entered this turn.)", [{ kind: "optional", of: "artifact-or-enchantment" }],
    ),
  ],
});
