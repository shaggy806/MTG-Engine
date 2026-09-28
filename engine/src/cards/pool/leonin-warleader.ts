import { defineCard } from "../define.js";

const ATTACK_TEXT =
  "Whenever this creature attacks, create two 1/1 white Cat creature tokens with lifelink that are tapped and attacking.";

export default defineCard({
  name: "Leonin Warleader",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Soldier"],
  power: 4,
  toughness: 4,
  text: ATTACK_TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Lifelink Cat Token",
        count: 2,
        tapped: true,
        attacking: "choose",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
