import { untappedEntryLand } from "../helpers.js";

export default untappedEntryLand("Mystic Sanctuary", "Island", {
  text:
    "When this land enters untapped, you may put target instant or sorcery card from your graveyard on top of your library.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
  effect: {
    kind: "may",
    prompt: "Put the targeted instant or sorcery card on top of your library?",
    effect: { kind: "put-on-library", target: 0, position: "top" },
  },
});
