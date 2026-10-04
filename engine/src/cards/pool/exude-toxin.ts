import { defineCard } from "../define.js";

const TEXT = "Each non-Dragon creature gets -X/-X until end of turn.";

export default defineCard({
  name: "Exude Toxin",
  art: "https://cards.scryfall.io/art_crop/back/0/d/0d4b46a3-847a-44a7-9f68-2cb4657cad61.jpg",
  manaCost: "{X}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  subtypes: ["Omen"],
  text: `${TEXT} (Then shuffle this card into its owner's library.)`,
  // The affected set is fixed as it resolves (rule 611.2c), as `modify-pt-all` does.
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", notSubtypes: ["Dragon"] },
    power: { product: ["x", -1] },
    toughness: { product: ["x", -1] },
    duration: "end-of-turn",
  },
  faces: ["Scavenger Regent", "Exude Toxin"],
  omen: true,
});
