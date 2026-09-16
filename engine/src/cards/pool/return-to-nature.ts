import { defineCard } from "../define.js";

export default defineCard({
  name: "Return to Nature",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Destroy target artifact.\n" +
    "• Destroy target enchantment.\n" +
    "• Exile target card from a graveyard.",
  // Each mode has its own target, so this is `castModal` (cast-time choice)
  // rather than the resolution-time `modal` effect — see AUTHORING §6.
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Destroy target enchantment.",
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Exile target card from a graveyard.",
        targets: [{ kind: "card-in-graveyard" }],
        effect: { kind: "exile", target: 0 },
      },
    ],
  },
});
