import { defineCard } from "../define.js";

// The same shape as Verix Bladewing: a permanent spell's kicker rider is an
// ETB trigger with a `self-kicked` intervening-if.
export default defineCard({
  name: "Josu Vess, Lich Knight",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Knight"],
  power: 4,
  toughness: 5,
  keywords: ["menace"],
  text:
    "Kicker {5}{B}\n" +
    "Menace\n" +
    "When Josu Vess, Lich Knight enters, if he was kicked, create eight 2/2 black " +
    "Zombie Knight creature tokens with menace.",
  kicker: { cost: "{5}{B}" },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "self-kicked" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Knight Token", count: 8 },
      resolve: null,
      text:
        "When Josu Vess, Lich Knight enters, if he was kicked, create eight 2/2 black " +
        "Zombie Knight creature tokens with menace.",
    },
  ],
});
