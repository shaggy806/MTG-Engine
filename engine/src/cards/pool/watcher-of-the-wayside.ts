import { defineCard } from "../define.js";

export default defineCard({
  name: "Watcher of the Wayside",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, target player mills two cards. You gain 2 life. (To mill two cards, a player puts the top two cards of their library into their graveyard.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "sequence",
        effects: [{ kind: "mill", target: 0, amount: 2 }, { kind: "gain-life", amount: 2 }],
      },
      resolve: null,
      text: "When this creature enters, target player mills two cards. You gain 2 life.",
    },
  ],
});
