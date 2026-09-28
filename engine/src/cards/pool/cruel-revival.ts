import { defineCard } from "../define.js";

export default defineCard({
  name: "Cruel Revival",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "Destroy target non-Zombie creature. It can't be regenerated. Return up to " +
    "one target Zombie card from your graveyard to your hand.",
  targets: [
    { kind: "permanent", filter: { type: "creature", notSubtypes: ["Zombie"] } },
    {
      kind: "optional",
      of: { kind: "card-in-graveyard", whose: "you", filter: { subtype: "Zombie" } },
    },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0, cantBeRegenerated: true },
      { kind: "return-to-hand", target: 1 },
    ],
  },
});
