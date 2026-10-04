import { defineCard } from "../define.js";

// EDHREC rank 6196.

export default defineCard({
  name: "Viridian Corrupter",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Elf", "Shaman"],
  power: 2,
  toughness: 2,
  keywords: ["infect"],
  text: "Infect (This creature deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)\nWhen this creature enters, destroy target artifact.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["artifact"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target artifact.",
    },
  ],
});
