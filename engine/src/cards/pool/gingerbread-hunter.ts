import { defineCard } from "../define.js";

export default defineCard({
  name: "Gingerbread Hunter",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 5,
  toughness: 5,
  text: "When this creature enters, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a Food token.",
    },
  ],
  faces: ["Gingerbread Hunter", "Puny Snack"],
  adventure: true,
});
