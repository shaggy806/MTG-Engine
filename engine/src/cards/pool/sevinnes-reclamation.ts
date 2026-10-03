import { defineCard } from "../define.js";

// The rulings this follows: if its target is illegal as it resolves, it
// doesn't resolve, and nothing is copied; the copy is made on the stack, not
// cast — so it wasn't cast from a graveyard and copies nothing itself — and
// abilities that trigger as the card returns resolve after the copy's new
// target is chosen, before the copy resolves. "A permanent card" is any card
// but an instant or sorcery.
const TEXT =
  "Return target permanent card with mana value 3 or less from your graveyard to the battlefield. If this " +
  "spell was cast from a graveyard, you may copy this spell and may choose a new target for the copy.";

export default defineCard({
  name: "Sevinne's Reclamation",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  flashback: { cost: "{4}{W}" },
  text:
    `${TEXT}\nFlashback {4}{W} (You may cast this card from your graveyard for its flashback cost. ` +
    "Then exile it.)",
  targets: [
    {
      kind: "card-in-graveyard",
      whose: "you",
      filter: { notTypes: ["instant", "sorcery"], manaValue: { op: "lte", n: 3 } },
    },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "put-onto-battlefield", target: 0 },
      {
        kind: "conditional",
        condition: { kind: "source", filter: { castFrom: "graveyard" } },
        then: {
          kind: "may",
          prompt: "Copy Sevinne's Reclamation, and choose a new target for the copy?",
          effect: { kind: "copy-spell", target: "source", newTargets: true },
        },
      },
    ],
  },
});
