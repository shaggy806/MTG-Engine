import { defineCard } from "../define.js";

// Whether it's an artifact creature is asked as the spell resolves.
export default defineCard({
  name: "Blacksmith's Skill",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Target permanent gains hexproof and indestructible until end of turn. If it's an artifact creature, it gets +2/+2 until end of turn.",
  targets: ["permanent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      {
        kind: "conditional",
        condition: { kind: "target", index: 0, filter: { types: ["artifact", "creature"] } },
        then: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      },
    ],
  },
});
