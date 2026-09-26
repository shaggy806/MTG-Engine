import { defineCard } from "../define.js";

const TEXT = "When this creature dies, return another target artifact card from your graveyard to your hand.";

// "Another" is any artifact card but this one, which is in the graveyard by
// the time the ability targets — an artifact that died alongside it is fair
// game (the ruling).
export default defineCard({
  name: "Myr Retriever",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [
        {
          kind: "other",
          of: { kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } },
          than: "source",
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: TEXT,
    },
  ],
});
