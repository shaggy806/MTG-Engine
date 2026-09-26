import { defineCard } from "../define.js";

// Every land on the battlefield — every player's, Urborg's own included — is
// a Swamp besides (layer 4), and so taps for {B} (rule 305.6).
const TEXT = "Each land is a Swamp in addition to its other land types.";

export default defineCard({
  name: "Urborg, Tomb of Yawgmoth",
  supertypes: ["legendary"],
  types: ["land"],
  text: TEXT,
  static: [{ affects: { scope: "filter", filter: { type: "land" } }, addSubtypes: ["Swamp"], text: TEXT }],
});
