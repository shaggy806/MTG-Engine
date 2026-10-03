import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When this creature enters, reveal cards from the top of your library until you reveal a land card. " +
  "Put that card onto the battlefield tapped and the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Clifftop Lookout",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Frog", "Scout"],
  power: 1,
  toughness: 2,
  keywords: ["reach"],
  text: `Reach\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "reveal-until",
        filter: { type: "land" },
        put: "battlefield",
        tapped: true,
        rest: "bottom-random",
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
