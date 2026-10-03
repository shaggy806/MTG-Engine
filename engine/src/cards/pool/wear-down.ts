import { defineCard } from "../define.js";
import { GIFT_KICKER, distinctTargets } from "../helpers.js";

// Gift a card (rule 702.174e). Promised, "two target artifacts and/or
// enchantments" is two different permanents (rule 601.2c), destroyed at once.
export default defineCard({
  name: "Wear Down",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Gift a card (You may promise an opponent a gift as you cast this spell. If you do, they draw a card before its other effects.)\n" +
    "Destroy target artifact or enchantment. If the gift was promised, instead destroy two target artifacts and/or enchantments.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "destroy", target: 0 },
  kicker: {
    ...GIFT_KICKER,
    targets: distinctTargets(2, "artifact-or-enchantment"),
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "card" },
        {
          kind: "sequence",
          simultaneous: true,
          effects: [
            { kind: "destroy", target: 0 },
            { kind: "destroy", target: 1 },
          ],
        },
      ],
    },
  },
});
