import { defineCard } from "../define.js";

export default defineCard({
  name: "Dinotomaton",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Dinosaur", "Gnome"],
  power: 4,
  toughness: 3,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\nWhen this creature enters, target creature you control gains menace until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "menace", duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature you control gains menace until end of turn.",
    },
  ],
});
