import { defineCard } from "../define.js";

export default defineCard({
  name: "Senate Guildmage",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "{W}, {T}: You gain 2 life.\n{U}, {T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "{W}, {T}: You gain 2 life.",
    },
    {
      cost: { mana: "{U}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{U}, {T}: Draw a card, then discard a card.",
    },
  ],
});
