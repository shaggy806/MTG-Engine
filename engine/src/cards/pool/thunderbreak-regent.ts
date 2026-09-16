import { defineCard } from "../define.js";

export default defineCard({
  name: "Thunderbreak Regent",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever a Dragon you control becomes the target of a spell or ability an opponent controls, this creature deals 3 damage to that player.",
  triggered: [
    {
      trigger: {
        on: "becomes-target",
        who: "you-control",
        filter: { subtype: "Dragon" },
        byOpponentOnly: true,
      },
      // "that player" — the trigger auto-fills this slot with whoever's
      // spell or ability did the targeting.
      targets: ["player"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: "Whenever a Dragon you control becomes the target of a spell or ability an opponent controls, this creature deals 3 damage to that player.",
    },
  ],
});
