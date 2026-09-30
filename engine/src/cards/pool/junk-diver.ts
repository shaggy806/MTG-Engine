import { defineCard } from "../define.js";

const TEXT = "When this creature dies, return another target artifact card from your graveyard to your hand.";

export default defineCard({
  name: "Junk Diver",
  manaCost: "{3}",
  types: ["artifact", "creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [{ kind: "other", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: TEXT,
    },
  ],
});
