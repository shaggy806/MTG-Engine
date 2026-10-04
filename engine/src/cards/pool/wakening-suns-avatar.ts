import { defineCard } from "../define.js";

// EDHREC rank 3252.
//
// Rulings:
//   [2017-09-29] If you cast a creature spell that enters the battlefield as a copy of Wakening
//     Sun's Avatar, such as Clone, the enters-the-battlefield ability will trigger.
//   [2017-09-29] If you put Wakening Sun's Avatar onto the battlefield from your hand without
//     casting it, its ability won't trigger.

const TEXT = "When this creature enters, if you cast it from your hand, destroy all non-Dinosaur creatures.";

export default defineCard({
  name: "Wakening Sun's Avatar",
  manaCost: "{5}{W}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dinosaur", "Avatar"],
  power: 7,
  toughness: 7,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "source", filter: { cast: true, castBy: "you", castFrom: "hand" } },
      targets: [],
      effect: { kind: "destroy-all", filter: { type: "creature", notSubtypes: ["Dinosaur"] } },
      resolve: null,
      text: TEXT,
    },
  ],
});
