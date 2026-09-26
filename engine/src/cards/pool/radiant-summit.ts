import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const ENTRY = "This land enters tapped unless you control two or more basic lands.";

// Typed Mountain Plains, so it taps for {R} or {W} (rule 305.6) and counts
// for everything that looks for either type — the printed abilities stand in
// for the intrinsic ones, as a shock land's do.
export default defineCard({
  name: "Radiant Summit",
  colors: [],
  types: ["land"],
  subtypes: ["Mountain", "Plains"],
  text: `({T}: Add {R} or {W}.)\n${ENTRY}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { type: "land", supertype: "basic" }, atLeast: 2 },
      },
      text: ENTRY,
    },
  ],
  activated: [manaTapAbility("R"), manaTapAbility("W")],
});
