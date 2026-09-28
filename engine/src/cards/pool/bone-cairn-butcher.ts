import { defineCard } from "../define.js";
import { mobilize } from "../helpers.js";

const MOBILIZE_TEXT =
  "Mobilize 2 (Whenever this creature attacks, create two tapped and attacking 1/1 red Warrior creature tokens. Sacrifice them at the beginning of the next end step.)";
const STATIC_TEXT = "Attacking tokens you control have deathtouch.";

export default defineCard({
  name: "Bone-Cairn Butcher",
  manaCost: "{1}{R}{W}{B}",
  colors: ["R", "W", "B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 4,
  toughness: 4,
  text: `${MOBILIZE_TEXT}\n${STATIC_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { token: true, attacking: true, controlledBy: "you" } },
      grantKeywords: ["deathtouch"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [mobilize(2)],
});
