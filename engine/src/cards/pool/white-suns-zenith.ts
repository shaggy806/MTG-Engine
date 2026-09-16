import { defineCard } from "../define.js";

export default defineCard({
  name: "White Sun's Zenith",
  manaCost: "{X}{W}{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Create X 2/2 white Cat creature tokens. Shuffle White Sun's Zenith into " +
    "its owner's library.",
  effect: { kind: "create-token", token: "Cat Token", count: "x" },
  // Only on resolving — a countered one goes to the graveyard, since the
  // shuffle is part of what the spell never got to do.
  shuffleIntoLibraryOnResolve: true,
});
