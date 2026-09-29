import { untappedEntryLand } from "../helpers.js";

export default untappedEntryLand("Dwarven Mine", "Mountain", {
  text: "When this land enters untapped, create a 1/1 red Dwarf creature token.",
  targets: [],
  effect: { kind: "create-token", token: "Dwarf Token", count: 1 },
});
