import { defineCard } from "../define.js";

export default defineCard({
  name: "Tireless Provisioner",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 3,
  toughness: 2,
  text:
    "Landfall — Whenever a land you control enters, create a Food token or a " +
    "Treasure token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: "Create a Food token.", effect: { kind: "create-token", token: "Food Token", count: 1 } },
          { text: "Create a Treasure token.", effect: { kind: "create-token", token: "Treasure Token", count: 1 } },
        ],
      },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, create a Food token or " +
        "a Treasure token.",
    },
  ],
});
