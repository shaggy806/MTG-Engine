import { defineCard } from "../define.js";

export default defineCard({
  name: "Runehorn Hellkite",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "{5}{R}, Exile this card from your graveyard: Each player discards their hand, then draws seven cards.",
  activated: [
    {
      // `zone: "graveyard"` makes exiling the card part of the cost — see
      // ActivatedAbility.zone.
      cost: { mana: "{5}{R}", tap: false },
      zone: "graveyard",
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "discard-hand", who: "each-player" },
          { kind: "draw", amount: 7, who: "each-player" },
        ],
      },
      resolve: null,
      text: "{5}{R}, Exile this card from your graveyard: Each player discards their hand, then draws seven cards.",
    },
  ],
});
