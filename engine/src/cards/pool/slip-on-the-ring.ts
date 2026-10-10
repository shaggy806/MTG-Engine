import { defineCard } from "../define.js";

// EDHREC rank 5021. A creature you own that someone else controls comes back
// under yours.
export default defineCard({
  name: "Slip On the Ring",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target creature you own, then return it to the battlefield under your control. The Ring tempts you.",
  targets: [{ kind: "permanent", filter: { type: "creature", ownedBy: "you" } }],
  effect: {
    kind: "sequence",
    effects: [{ kind: "flicker", target: 0, underYourControl: true }, { kind: "the-ring-tempts-you" }],
  },
});
