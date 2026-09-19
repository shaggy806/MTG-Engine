import { defineCard } from "../define.js";

export default defineCard({
  name: "Unearth",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Return target creature card with mana value 3 or less from your graveyard to the battlefield.\n" +
    "Cycling {2} ({2}, Discard this card: Draw a card.)",
  targets: [
    {
      kind: "card-in-graveyard",
      whose: "you",
      filter: { type: "creature", manaValue: { op: "lte", n: 3 } },
    },
  ],
  effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
  cycling: { cost: "{2}" },
});
