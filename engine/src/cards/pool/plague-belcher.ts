import { defineCard } from "../define.js";

// EDHREC rank 3692.
//
// Rulings:
//   [2017-04-18] If another Zombie you control dies at the same time as Plague Belcher, Plague
//     Belcher's last ability will trigger for that Zombie.
//   [2017-04-18] In a Two-Headed Giant game, the triggered ability of Plague Belcher causes the
//     opposing team to lose 2 life.

const ETB_TEXT = "When this creature enters, put two -1/-1 counters on target creature you control.";
const DIES_TEXT = "Whenever another Zombie you control dies, each opponent loses 1 life.";

export default defineCard({
  name: "Plague Belcher",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Beast"],
  power: 5,
  toughness: 4,
  keywords: ["menace"],
  text: `Menace\n${ETB_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "-1/-1", amount: 2 },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Zombie" }, otherOnly: true },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
