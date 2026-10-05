import { defineCard } from "../define.js";

export default defineCard({
  name: "Trespasser's Curse",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura", "Curse"],
  text: "Enchant player\nWhenever a creature enchanted player controls enters, that player loses 1 life and you gain 1 life.",
  targets: ["player"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "enchanted-player-controls", filter: { type: "creature" } },
      targets: [],
      // "That player" is the enchanted player as it triggered — the trigger
      // player a Curse's trigger names when its event names nobody.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "trigger-player" },
          { kind: "gain-life", amount: 1, who: "you" },
        ],
      },
      resolve: null,
      text: "Whenever a creature enchanted player controls enters, that player loses 1 life and you gain 1 life.",
    },
  ],
});
