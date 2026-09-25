import { defineCard } from "../define.js";

export default defineCard({
  name: "Gruul Guildmage",
  manaCost: "{R/G}{R/G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  text: "({R/G} can be paid with either {R} or {G}.)\n{3}{R}, Sacrifice a land: This creature deals 2 damage to target player or planeswalker.\n{3}{G}: Target creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false, sacrifice: { filter: { type: "land" } } },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{3}{R}, Sacrifice a land: This creature deals 2 damage to target player or planeswalker.",
    },
    {
      cost: { mana: "{3}{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{3}{G}: Target creature gets +2/+2 until end of turn.",
    },
  ],
});
