import { defineCard } from "../define.js";

const TEXT =
  "Return target nonland permanent to its owner's hand. Then that permanent's controller may sacrifice a land of " +
  "their choice. If the player does, they may copy this spell and may choose a new target for that copy.";

// "That permanent's controller" is whoever controlled it as it left (rule
// 608.2h) — the caster too, for one of their own. Only a player with a land
// is offered the sacrifice; the copy is theirs to make, theirs to aim and
// theirs to control, so its own "that permanent's controller" may carry the
// chain on.
export default defineCard({
  name: "Chain of Vapor",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: TEXT,
  targets: ["nonland-permanent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0 },
      {
        kind: "each-player-may",
        who: { controllerOfTarget: 0 },
        options: [{ sacrifice: { type: "land" }, text: "Sacrifice a land" }],
        ifDid: {
          kind: "each-player-may",
          who: "that-player",
          prompt: "Copy Chain of Vapor? (You may choose a new target for the copy.)",
          effect: { kind: "copy-spell", target: "source", newTargets: true },
        },
      },
    ],
  },
});
