import { defineCard } from "../define.js";

// Becoming blocked by several creatures triggers it once (the ruling).
export default defineCard({
  name: "Ichorclaw Myr",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Myr"],
  power: 1,
  toughness: 1,
  keywords: ["infect"],
  text: "Infect (This creature deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)\nWhenever this creature becomes blocked, it gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "becomes-blocked", who: "self" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever this creature becomes blocked, it gets +2/+2 until end of turn.",
    },
  ],
});
