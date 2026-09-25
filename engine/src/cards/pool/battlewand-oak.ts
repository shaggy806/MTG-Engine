import { defineCard } from "../define.js";

export default defineCard({
  name: "Battlewand Oak",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk", "Warrior"],
  power: 1,
  toughness: 3,
  text: "Whenever a Forest you control enters, this creature gets +2/+2 until end of turn.\nWhenever you cast a Treefolk spell, this creature gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Forest" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever a Forest you control enters, this creature gets +2/+2 until end of turn.",
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Treefolk" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you cast a Treefolk spell, this creature gets +2/+2 until end of turn.",
    },
  ],
});
