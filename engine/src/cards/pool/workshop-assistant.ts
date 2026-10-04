import { defineCard } from "../define.js";

// EDHREC rank 3935.
//
// Rulings:
//   [2020-11-10] If another artifact card is put into your graveyard at the same time as Workshop
//     Assistant, you can target it with Workshop Assistant's triggered ability.
//
// Myr Retriever's shape: "another" is any artifact card but this one, which
// is in the graveyard by the time the ability targets.
const TEXT = "When this creature dies, return another target artifact card from your graveyard to your hand.";

export default defineCard({
  name: "Workshop Assistant",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 2,
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
