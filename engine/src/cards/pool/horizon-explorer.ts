import { defineCard } from "../define.js";

const UNTAPPED_TEXT = "Lands you control enter untapped.";
const ATTACK_TEXT =
  'Whenever you attack a player, create a Lander token. (It\'s an artifact with "{2}, {T}, Sacrifice this token: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.")';

// The Wandering Minstrel's replacement. One Lander for each player attacked.
export default defineCard({
  name: "Horizon Explorer",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect", "Scout"],
  power: 2,
  toughness: 4,
  text: `${UNTAPPED_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "land", controlledBy: "you" },
        untapped: true,
      },
      text: UNTAPPED_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks-player", who: "you", defender: "any" },
      targets: [],
      effect: { kind: "create-token", token: "Lander Token", count: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
