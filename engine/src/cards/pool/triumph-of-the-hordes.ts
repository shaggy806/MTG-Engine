import { defineCard } from "../define.js";

// Only the creatures you control as it resolves (rule 611.2c).
export default defineCard({
  name: "Triumph of the Hordes",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Until end of turn, creatures you control get +1/+1 and gain trample and infect. (Creatures with infect deal damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "trample",
        duration: "end-of-turn",
      },
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "infect",
        duration: "end-of-turn",
      },
    ],
  },
});
