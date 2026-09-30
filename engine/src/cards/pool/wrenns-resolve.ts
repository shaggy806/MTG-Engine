import { defineCard } from "../define.js";

export default defineCard({
  name: "Wrenn's Resolve",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Exile the top two cards of your library. Until the end of your next turn, you may play those cards.",
  effect: { kind: "impulse-exile", amount: 2, duration: "your-next-turn" },
});
