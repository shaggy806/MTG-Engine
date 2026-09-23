import { defineCard } from "../define.js";

// Fleshbag Marauder's edict narrowed to nontoken creatures. Each player picks
// their own; the Marauder is a nontoken creature, so it can be (and, alone,
// must be) its controller's pick — the 2024-06-07 ruling.
const TEXT = "When this creature enters, each player sacrifices a nontoken creature of their choice.";

export default defineCard({
  name: "Accursed Marauder",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Warrior"],
  power: 2,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sacrifice",
        who: "each-player",
        filter: { type: "creature", token: false },
        count: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
