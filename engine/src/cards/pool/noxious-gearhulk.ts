import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, you may destroy another target creature. If a creature is destroyed this way, you gain life equal to its toughness.";

// "Destroyed this way" — not an indestructible creature that survived, but
// one a Rest in Peace exiled instead still counts — and its toughness is as
// it last existed on the battlefield (the rulings).
export default defineCard({
  name: "Noxious Gearhulk",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 5,
  toughness: 4,
  keywords: ["menace"],
  text: `Menace\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "other", of: "creature" }],
      effect: {
        kind: "may",
        prompt: "Destroy the target creature?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "destroy", target: 0 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "destroyed", atLeast: 1 },
              then: { kind: "gain-life", amount: { toughnessOf: 0 } },
            },
          ],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
