import { defineCard } from "../define.js";

// EDHREC rank 4652.
// Makes Clue → use "Clue Token".
//
// Rulings:
//   [2024-02-02] If the artifact you target with Kellan, Inquisitive Prodigy's triggered ability
//     isn't destroyed (perhaps because it's indestructible), you will still draw a card as long as
//     you control the artifact.
//   [2024-02-02] The effect of Tail the Suspect that allows you to play an additional land is
//     cumulative with similar effects. For example, on a turn where you cast two Tail the
//     Suspects, you'll be able to play three lands.
//
// The draw is Boomerang Basics' shape: the target is read live if it's still there, or as it
// last existed on the battlefield once destroyed. No target chosen, no draw.

const ATTACK_TEXT =
  "Whenever Kellan attacks, destroy up to one target artifact. If you controlled that permanent, draw a card.";

export default defineCard({
  name: "Kellan, Inquisitive Prodigy",
  manaCost: "{2}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Faerie", "Detective"],
  power: 3,
  toughness: 4,
  keywords: ["flying", "vigilance"],
  text: `Flying, vigilance\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "optional", of: "artifact" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { controlledBy: "you" } },
            then: { kind: "draw", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  faces: ["Kellan, Inquisitive Prodigy", "Tail the Suspect"],
  adventure: true,
});
