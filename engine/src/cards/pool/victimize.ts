import { defineCard } from "../define.js";

export default defineCard({
  name: "Victimize",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Choose two target creature cards in your graveyard. Sacrifice a creature. " +
    "If you do, return the chosen cards to the battlefield tapped.",
  targets: [
    { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } },
    { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } },
  ],
  // "Sacrifice a creature" is an additional cost of casting, not part of the
  // resolution, which is why it gates castability rather than being a
  // `sacrifice` effect that could fizzle the reanimation.
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  // One instruction, "return the chosen cards": they leave the graveyard
  // together, so a "whenever one or more cards leave your graveyard" trigger
  // fires once.
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "put-onto-battlefield", target: 0, enterTapped: true },
      { kind: "put-onto-battlefield", target: 1, enterTapped: true },
    ],
  },
});
