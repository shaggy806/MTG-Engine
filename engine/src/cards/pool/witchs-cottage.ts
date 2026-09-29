import { untappedEntryLand } from "../helpers.js";

export default untappedEntryLand("Witch's Cottage", "Swamp", {
  text: "When this land enters untapped, you may put target creature card from your graveyard on top of your library.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: {
    kind: "may",
    prompt: "Put the targeted creature card on top of your library?",
    effect: { kind: "put-on-library", target: 0, position: "top" },
  },
});
