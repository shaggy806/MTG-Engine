import { defineCard } from "../define.js";

// The returned cards enter as one event, and only then become 1/1 Spirits
// with flying (the effect is created after the return, not as they enter),
// for as long as each stays on the battlefield. "Is a 1/1" sets base P/T
// (layer 7b), so counters and anthems still apply on top.
export default defineCard({
  name: "Storm of Souls",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Return all creature cards from your graveyard to the battlefield. Each of them is a 1/1 Spirit " +
    "with flying in addition to its other types. Exile Storm of Souls.",
  exileOnResolve: true,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-from-graveyard", filter: { type: "creature" }, destination: "battlefield", count: "all" },
      {
        kind: "animate-all",
        filter: { thisWay: "put-onto-battlefield" },
        power: 1,
        toughness: 1,
        addSubtypes: ["Spirit"],
        keywords: ["flying"],
        duration: "permanent",
      },
    ],
  },
});
