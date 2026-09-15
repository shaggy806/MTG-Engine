import { defineCard } from "../define.js";

export default defineCard({
  name: "Ayara, First of Locthwain",
  manaCost: "{B}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Noble"],
  power: 2,
  toughness: 3,
  text:
    "Whenever Ayara, First of Locthwain or another black creature you control enters, each " +
    "opponent loses 1 life and you gain 1 life.\n" +
    "{T}, Sacrifice another black creature: Draw a card.",
  triggered: [
    {
      // "Ayara **or another**" — no `otherOnly`, so Ayara's own entry counts.
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", colors: ["B"] },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text:
        "Whenever Ayara, First of Locthwain or another black creature you control enters, each " +
        "opponent loses 1 life and you gain 1 life.",
    },
  ],
  activated: [
    {
      // `otherOnly` is what makes the sacrifice "another" — Ayara can't eat
      // herself to draw.
      cost: {
        mana: null,
        tap: true,
        sacrifice: { filter: { type: "creature", colors: ["B"], controlledBy: "you" } },
      },
      otherOnly: true,
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{T}, Sacrifice another black creature: Draw a card.",
    },
  ],
});
