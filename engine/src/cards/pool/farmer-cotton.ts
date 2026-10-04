import { defineCard } from "../define.js";

// EDHREC rank 2922.
//
// Rulings:
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.
// X is the X it was cast with (Springleaf Parade's shape); 0 if it entered without being cast.
const ENTER_TEXT = "When this creature enters, create X 1/1 white Halfling creature tokens and X Food tokens.";

export default defineCard({
  name: "Farmer Cotton",
  manaCost: "{X}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Peasant"],
  power: 1,
  toughness: 1,
  text: `${ENTER_TEXT} (They're artifacts with "{2}, {T}, Sacrifice this token: You gain 3 life.")`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Halfling Token", count: "x" },
          { kind: "create-token", token: "Food Token", count: "x" },
        ],
        // One instruction: the Halflings and the Food enter together.
        simultaneous: true,
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
