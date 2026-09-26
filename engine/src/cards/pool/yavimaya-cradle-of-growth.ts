import { defineCard } from "../define.js";

// Every land on the battlefield — every player's, Yavimaya's own included —
// is a Forest besides (layer 4), and so taps for {G} (rule 305.6).
const TEXT = "Each land is a Forest in addition to its other land types.";

export default defineCard({
  name: "Yavimaya, Cradle of Growth",
  supertypes: ["legendary"],
  types: ["land"],
  text: TEXT,
  static: [{ affects: { scope: "filter", filter: { type: "land" } }, addSubtypes: ["Forest"], text: TEXT }],
});
