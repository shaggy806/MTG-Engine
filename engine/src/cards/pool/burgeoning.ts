import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent plays a land, you may put a land card from your hand onto the battlefield.";

// Played, not put onto the battlefield by an effect (the ruling) — the
// `plays-land` trigger. Putting a land onto the battlefield isn't playing
// one, so it takes no land drop of yours.
export default defineCard({
  name: "Burgeoning",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "plays-land", who: "opponent" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "land" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
