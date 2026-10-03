import { defineCard } from "../define.js";

// Ten poison counters each at once is a draw (the ruling — rule 104.4a).
export default defineCard({
  name: "Ichor Rats",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Rat"],
  power: 2,
  toughness: 1,
  keywords: ["infect"],
  text: "Infect (This creature deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)\nWhen this creature enters, each player gets a poison counter.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "add-player-counters", counter: "poison", amount: 1, who: "each-player" },
      resolve: null,
      text: "When this creature enters, each player gets a poison counter.",
    },
  ],
});
