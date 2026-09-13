import { defineCard } from "../define.js";

export default defineCard({
  name: "Ob Nixilis, the Fallen",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 3,
  toughness: 3,
  text:
    "Landfall — Whenever a land you control enters, you may have target player lose 3 " +
    "life. If you do, put three +1/+1 counters on Ob Nixilis, the Fallen.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["player"],
      effect: {
        kind: "may",
        prompt: "Have target player lose 3 life?",
        effect: { kind: "lose-life", amount: 3, target: 0 },
        then: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 3 },
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, you may have target player lose 3 life. If you do, put three +1/+1 counters on Ob Nixilis, the Fallen.",
    },
  ],
});
