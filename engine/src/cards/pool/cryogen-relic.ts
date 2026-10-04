import { defineCard } from "../define.js";

// EDHREC rank 4013.

const DRAW_TEXT = "When this artifact enters or leaves the battlefield, draw a card.";
const STUN_TEXT = "{1}{U}, Sacrifice this artifact: Put a stun counter on up to one target tapped creature. (If a permanent with a stun counter would become untapped, remove one from it instead.)";

export default defineCard({
  name: "Cryogen Relic",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: `${DRAW_TEXT}\n${STUN_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false, sacrifice: "self" },
      targets: [{ kind: "optional", of: { kind: "permanent", filter: { type: "creature", tapped: true } } }],
      effect: { kind: "add-counter", target: 0, counter: "stun", amount: 1 },
      resolve: null,
      text: STUN_TEXT,
    },
  ],
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: { kind: "draw", amount: 1 }, resolve: null, text: DRAW_TEXT },
    { trigger: { on: "leaves-battlefield", who: "self" }, targets: [], effect: { kind: "draw", amount: 1 }, resolve: null, text: DRAW_TEXT },
  ],
});
