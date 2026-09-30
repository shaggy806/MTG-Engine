import { defineCard } from "../define.js";

export default defineCard({
  name: "Kiora's Follower",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  types: ["creature"],
  subtypes: ["Merfolk"],
  power: 2,
  toughness: 2,
  text: "{T}: Untap another target permanent.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "other", of: "permanent" }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{T}: Untap another target permanent.",
    },
  ],
});
