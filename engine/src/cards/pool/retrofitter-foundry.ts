import { defineCard } from "../define.js";

// EDHREC rank 4563.
// Makes Thopter → use "Thopter Token".
// Makes Servo → use "Servo Token".
// Makes Construct → new token "Construct Token (Retrofitter Foundry)" (scaffolded).

export default defineCard({
  name: "Retrofitter Foundry",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{3}: Untap this artifact.\n{2}, {T}: Create a 1/1 colorless Servo artifact creature token.\n{1}, {T}, Sacrifice a Servo: Create a 1/1 colorless Thopter artifact creature token with flying.\n{T}, Sacrifice a Thopter: Create a 4/4 colorless Construct artifact creature token.",
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{3}: Untap this artifact.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Servo Token", count: 1 },
      resolve: null,
      text: "{2}, {T}: Create a 1/1 colorless Servo artifact creature token.",
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: { filter: { subtype: "Servo" } } },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: "{1}, {T}, Sacrifice a Servo: Create a 1/1 colorless Thopter artifact creature token with flying.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Thopter" } } },
      targets: [],
      effect: { kind: "create-token", token: "Construct Token (Retrofitter Foundry)", count: 1 },
      resolve: null,
      text: "{T}, Sacrifice a Thopter: Create a 4/4 colorless Construct artifact creature token.",
    },
  ],
});
