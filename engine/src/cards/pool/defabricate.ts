import { defineCard } from "../define.js";

// EDHREC rank 6461.
//
// The first mode is Dissipate's `into: "exile"` — still a counter, so a spell
// that can't be countered isn't exiled. The second is Stifle's.
export default defineCard({
  name: "Defabricate",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Counter target artifact or enchantment spell. If that spell is countered this way, exile it instead of putting it into its owner's graveyard.\n" +
    "• Counter target activated or triggered ability.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text:
          "Counter target artifact or enchantment spell. If that spell is countered this way, exile it instead of putting it into its owner's graveyard.",
        targets: [{ kind: "spell", filter: { typesAnyOf: ["artifact", "enchantment"] } }],
        effect: { kind: "counter", target: 0, into: "exile" },
      },
      {
        text: "Counter target activated or triggered ability.",
        targets: ["activated-or-triggered-ability"],
        effect: { kind: "counter", target: 0 },
      },
    ],
  },
});
