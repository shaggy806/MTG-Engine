import { defineCard } from "../define.js";

// EDHREC rank 3770. Three copies of the exiled card, made in exile and each
// its own "may" (rule 707.12a), cast one after another as this resolves; any
// not cast cease to exist (704.5e).
const TEXT =
  "Exile target instant or sorcery card from a graveyard. Copy that card three times. You may cast the copies without paying their mana costs. Exile Mnemonic Deluge.";

export default defineCard({
  name: "Mnemonic Deluge",
  manaCost: "{6}{U}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: TEXT,
  targets: [{ kind: "card-in-graveyard", whose: "any", filter: { typesAnyOf: ["instant", "sorcery"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      { kind: "cast-now", from: "exiled-this-way", copies: 3, free: true },
    ],
  },
  exileOnResolve: true,
});
