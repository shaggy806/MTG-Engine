import { defineCard } from "../define.js";

// EDHREC rank 5804.
//
// Rulings:
//   [2026-01-27] If you gain an amount of life "for each" of something or "equal to the number" of
//     something, that life is gained as one event and South Wind Avatar's last ability will
//     trigger only once.
//   [2026-01-27] Use the creature's toughness as it last existed on the battlefield to determine
//     how much life you gain with South Wind Avatar's second ability.
//   [2026-01-27] Each creature with lifelink dealing combat damage causes a separate life-gaining
//     event.

export default defineCard({
  name: "South Wind Avatar",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Snake", "Spirit", "Avatar"],
  power: 3,
  toughness: 4,
  keywords: ["deathtouch"],
  text: "Deathtouch\nWhenever another creature you control dies, you gain life equal to its toughness.\nWhenever you gain life, each opponent loses 1 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      // The dead creature's toughness as it last existed (the ruling):
      // `toughnessOf` reads the trigger object's last-known information.
      effect: { kind: "gain-life", amount: { toughnessOf: "trigger-object" } },
      resolve: null,
      text: "Whenever another creature you control dies, you gain life equal to its toughness.",
    },
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever you gain life, each opponent loses 1 life.",
    },
  ],
});
