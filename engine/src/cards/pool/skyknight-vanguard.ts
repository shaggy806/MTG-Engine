import { defineCard } from "../define.js";

const ATTACK_TEXT =
  "Whenever this creature attacks, create a 1/1 white Soldier creature token that's tapped and attacking.";

export default defineCard({
  name: "Skyknight Vanguard",
  manaCost: "{R}{W}",
  colors: ["R", "W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 1, tapped: true, attacking: "choose" },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
