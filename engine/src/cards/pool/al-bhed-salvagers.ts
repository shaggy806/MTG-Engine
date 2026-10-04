import { defineCard } from "../define.js";

// EDHREC rank 5698.
//
// Rulings:
//   [2025-06-06] If Al Bhed Salvagers dies at the same time as one or more other creatures and/or
//     artifacts you control, its ability will trigger once for each of those permanents, including
//     itself.
//   [2025-06-06] The term "dies" isn't exclusive to creatures. Al Bhed Salvagers's ability will
//     trigger when an artifact is put into a graveyard from the battlefield, even if that artifact
//     wasn't a creature.

const TEXT =
  "Whenever this creature or another creature or artifact you control dies, target opponent loses 1 life and you gain 1 life.";

export default defineCard({
  name: "Al Bhed Salvagers",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Artificer", "Warrior"],
  power: 2,
  toughness: 3,
  text: TEXT,
  // Vengeful Bloodwitch's two halves; "another creature or artifact" is
  // Judge Magister Gabranth's filter (an artifact dies too — the ruling).
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, target: 0 },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { typesAnyOf: ["creature", "artifact"] },
        otherOnly: true,
      },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, target: 0 },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
