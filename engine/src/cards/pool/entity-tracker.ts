import { defineCard } from "../define.js";

// EDHREC rank 2139. Eerie is one ability with two trigger events, written as
// two entries (`sameAbilityAs`).
const EERIE = "Eerie — Whenever an enchantment you control enters and whenever you fully unlock a Room, draw a card.";

export default defineCard({
  name: "Entity Tracker",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 2,
  toughness: 3,
  keywords: ["flash"],
  text: `Flash\n${EERIE}`,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } }, targets: [], effect: { kind: "draw", amount: 1 }, resolve: null, text: EERIE },
    {
      trigger: { on: "door-unlocked", who: "you-control", fully: true },
      sameAbilityAs: 0,
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: EERIE,
    },
  ],
});
