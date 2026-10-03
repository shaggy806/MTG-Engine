import { defineCard } from "../define.js";
import { GIFT_KICKER, giftTrigger } from "../helpers.js";

// Gift a card (rule 702.174b): promised, it enters with two "if the gift was
// promised" triggers, its controller ordering them. The gift can be promised
// even with no artifact or enchantment to destroy (the ruling).
const DESTROY_TEXT =
  "When this creature enters, if the gift was promised, destroy target artifact or enchantment an opponent controls.";

export default defineCard({
  name: "Scrapshooter",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Raccoon", "Archer"],
  power: 4,
  toughness: 4,
  keywords: ["reach"],
  text:
    "Gift a card (You may promise an opponent a gift as you cast this spell. If you do, when it enters, they draw a card.)\n" +
    `Reach\n${DESTROY_TEXT}`,
  kicker: GIFT_KICKER,
  triggered: [
    giftTrigger("card"),
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "self-kicked" },
      targets: [{ kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["artifact", "enchantment"] } }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: DESTROY_TEXT,
    },
  ],
});
