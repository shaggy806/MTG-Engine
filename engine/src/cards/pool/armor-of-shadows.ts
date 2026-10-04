import { defineCard } from "../define.js";

// EDHREC rank 6371.

export default defineCard({
  name: "Armor of Shadows",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Until end of turn, target creature gets +1/+0 and gains indestructible. (Damage and effects that say \"destroy\" don't destroy it.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
    ],
  },
});
