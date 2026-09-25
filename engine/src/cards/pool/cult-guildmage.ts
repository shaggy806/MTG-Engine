import { defineCard } from "../define.js";

export default defineCard({
  name: "Cult Guildmage",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  text: "{3}{B}, {T}: Target player discards a card. Activate only as a sorcery.\n{R}, {T}: This creature deals 1 damage to target opponent or planeswalker.",
  activated: [
    {
      cost: { mana: "{3}{B}", tap: true },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "{3}{B}, {T}: Target player discards a card. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
    {
      cost: { mana: "{R}", tap: true },
      targets: ["opponent-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{R}, {T}: This creature deals 1 damage to target opponent or planeswalker.",
    },
  ],
});
