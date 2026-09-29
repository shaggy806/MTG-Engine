import { defineCard } from "../define.js";

const DIES_TEXT = "When Atsushi dies, choose one —";
const EXILE_MODE =
  "Exile the top two cards of your library. Until the end of your next turn, you may play those cards.";
const TREASURE_MODE = "Create three Treasure tokens.";

export default defineCard({
  name: "Atsushi, the Blazing Sky",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Spirit"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "trample"],
  text: `Flying, trample\n${DIES_TEXT}\n• ${EXILE_MODE}\n• ${TREASURE_MODE}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: EXILE_MODE, effect: { kind: "impulse-exile", amount: 2, duration: "your-next-turn" } },
          { text: TREASURE_MODE, effect: { kind: "create-token", token: "Treasure Token", count: 3 } },
        ],
      },
      resolve: null,
      text: `${DIES_TEXT} ${EXILE_MODE} ${TREASURE_MODE}`,
    },
  ],
});
