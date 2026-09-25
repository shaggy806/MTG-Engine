import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghost-Lit Stalker",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: "{4}{B}, {T}: Target player discards two cards. Activate only as a sorcery.\nChannel — {5}{B}{B}, Discard this card: Target player discards four cards. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{4}{B}", tap: true },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 2 },
      resolve: null,
      text: "{4}{B}, {T}: Target player discards two cards. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
    {
      cost: { mana: "{5}{B}{B}", tap: false },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 4 },
      resolve: null,
      text: "Channel — {5}{B}{B}, Discard this card: Target player discards four cards. Activate only as a sorcery.",
      zone: "hand",
      sorcerySpeed: true,
    },
  ],
});
