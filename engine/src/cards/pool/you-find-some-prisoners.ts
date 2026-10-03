import { defineCard } from "../define.js";

// The two cards not chosen stay exiled with no permission, and so does the
// chosen one if it isn't played (the ruling). "Play" includes a land, with the
// land drop; the any-colour spending is only for casting it this way (rule
// 118.14).
const CHAINS_MODE = "Break Their Chains — Destroy target artifact.";
const INTERROGATE_MODE =
  "Interrogate Them — Exile the top three cards of target opponent's library. Choose one of them. Until the end of your next turn, you may play that card, and you may spend mana as though it were mana of any color to cast it.";

export default defineCard({
  name: "You Find Some Prisoners",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: `Choose one —\n• ${CHAINS_MODE}\n• ${INTERROGATE_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: CHAINS_MODE,
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: INTERROGATE_MODE,
        targets: ["opponent"],
        effect: {
          kind: "impulse-exile",
          amount: 3,
          whose: 0,
          choose: 1,
          duration: "your-next-turn",
          spendAs: "any-color",
        },
      },
    ],
  },
});
