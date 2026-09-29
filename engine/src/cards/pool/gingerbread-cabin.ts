import { untappedEntryLand } from "../helpers.js";

export default untappedEntryLand("Gingerbread Cabin", "Forest", {
  text:
    'When this land enters untapped, create a Food token. (It\'s an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")',
  targets: [],
  effect: { kind: "create-token", token: "Food Token", count: 1 },
});
