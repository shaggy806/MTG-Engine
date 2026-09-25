import { defineCard } from "../define.js";

export default defineCard({
  name: "Obelisk of Alara",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  text: "{1}{W}, {T}: You gain 5 life.\n{1}{U}, {T}: Draw a card, then discard a card.\n{1}{B}, {T}: Target creature gets -2/-2 until end of turn.\n{1}{R}, {T}: This artifact deals 3 damage to target player or planeswalker.\n{1}{G}, {T}: Target creature gets +4/+4 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 5 },
      resolve: null,
      text: "{1}{W}, {T}: You gain 5 life.",
    },
    {
      cost: { mana: "{1}{U}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{1}{U}, {T}: Draw a card, then discard a card.",
    },
    {
      cost: { mana: "{1}{B}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{B}, {T}: Target creature gets -2/-2 until end of turn.",
    },
    {
      cost: { mana: "{1}{R}", tap: true },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: "{1}{R}, {T}: This artifact deals 3 damage to target player or planeswalker.",
    },
    {
      cost: { mana: "{1}{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 4, toughness: 4, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{G}, {T}: Target creature gets +4/+4 until end of turn.",
    },
  ],
});
