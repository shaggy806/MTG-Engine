import { defineCard } from "../define.js";

const FLYING_TEXT = "Other enchantment creatures you control have flying.";
// Once for each player attacked (ruling), and the Glimmer attacks that one.
const ATTACK_TEXT =
  "Whenever you attack a player, create a 1/1 white Glimmer enchantment creature token that's tapped and attacking that player.";

export default defineCard({
  name: "Soaring Lightbringer",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Bird", "Glimmer"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${FLYING_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { types: ["enchantment", "creature"], controlledBy: "you" },
        excludeSelf: true,
      },
      grantKeywords: ["flying"],
      text: FLYING_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks-player", who: "you", defender: "opponent" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Glimmer Token",
        count: 1,
        tapped: true,
        attacking: { player: "trigger-player" },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
