import { defineCard } from "../define.js";
import type { TargetSpec } from "../../target.js";

// EDHREC rank 5828.
//
// Five instances of the word "target", each its own optional slot: the same
// card can be chosen for more than one of them (rule 115.3 — an artifact
// enchantment card as both the artifact and the enchantment), so no slot is
// `other` than another. They return together (Macabre Waltz's `simultaneous`),
// and the spell exiles itself as it resolves.

const upToOne = (type: "artifact" | "enchantment" | "instant" | "sorcery" | "planeswalker"): TargetSpec => ({
  kind: "optional",
  of: { kind: "card-in-graveyard", whose: "you", filter: { type } },
});

export default defineCard({
  name: "Reconstruct History",
  manaCost: "{2}{R}{W}",
  colors: ["W", "R"],
  types: ["sorcery"],
  text: "Return up to one target artifact card, up to one target enchantment card, up to one target instant card, up to one target sorcery card, and up to one target planeswalker card from your graveyard to your hand.\nExile Reconstruct History.",
  targets: [upToOne("artifact"), upToOne("enchantment"), upToOne("instant"), upToOne("sorcery"), upToOne("planeswalker")],
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "return-to-hand", target: 0, from: "graveyard" },
      { kind: "return-to-hand", target: 1, from: "graveyard" },
      { kind: "return-to-hand", target: 2, from: "graveyard" },
      { kind: "return-to-hand", target: 3, from: "graveyard" },
      { kind: "return-to-hand", target: 4, from: "graveyard" },
    ],
  },
  exileOnResolve: true,
});
