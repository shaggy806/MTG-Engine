import { demonstrate } from "../helpers.js";
import { defineCard } from "../define.js";

// "Its controller" is the destroyed permanent's, as it last existed (a stolen
// creature's thief): they exile from their own library until a nonland card,
// which they may cast free — X is 0, no alternative cost (the rulings) — and
// everything exiled stays exiled. Not destroyed (indestructible, regenerated),
// none of it happens.
const TEXT =
  "Destroy target artifact or creature you don't control. If that permanent is destroyed this way, its controller " +
  "exiles cards from the top of their library until they exile a nonland card, then they may cast that card " +
  "without paying its mana cost.";

export default defineCard({
  name: "Transforming Flourish",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Demonstrate (When you cast this spell, you may copy it. If you do, choose an opponent to also copy it. " +
    `Players may choose new targets for their copies.)\n${TEXT}`,
  targets: [{ kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["artifact", "creature"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "conditional",
        condition: { kind: "this-way", what: "destroyed", atLeast: 1 },
        then: {
          kind: "reveal-until",
          whose: { controllerOfTarget: 0 },
          filter: { notTypes: ["land"] },
          exile: true,
          rest: "stay",
          // The card found is the only target here: its controller in exile
          // is its owner, the player whose library it came from.
          then: { kind: "cast-now", target: 0, free: true, by: { controllerOfTarget: 0 } },
        },
      },
    ],
  },
  triggered: [demonstrate()],
});
