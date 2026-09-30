import { defineCard } from "../define.js";

export default defineCard({
  name: "Escape to the Wilds",
  manaCost: "{3}{R}{G}",
  colors: ["R", "G"],
  types: ["sorcery"],
  text:
    "Exile the top five cards of your library. You may play cards exiled this way until the end of your next turn.\n" +
    "You may play an additional land this turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "impulse-exile", amount: 5, duration: "your-next-turn" },
      { kind: "additional-land-drop", amount: 1 },
    ],
  },
});
