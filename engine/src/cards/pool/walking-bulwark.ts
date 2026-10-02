import { defineCard } from "../define.js";

// Assigning combat damage by toughness changes no power (2022-09-09 ruling):
// a fight still uses power.
export default defineCard({
  name: "Walking Bulwark",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text:
    "Defender\n" +
    "{2}: Until end of turn, target creature with defender gains haste, can attack as though it " +
    "didn't have defender, and assigns combat damage equal to its toughness rather than its power. " +
    "Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      sorcerySpeed: true,
      targets: [{ kind: "permanent", filter: { type: "creature", keyword: "defender" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
          { kind: "attack-despite-defender", target: 0 },
          { kind: "damage-by-toughness", target: 0 },
        ],
      },
      resolve: null,
      text:
        "{2}: Until end of turn, target creature with defender gains haste, can attack as though it " +
        "didn't have defender, and assigns combat damage equal to its toughness rather than its power. " +
        "Activate only as a sorcery.",
    },
  ],
});
