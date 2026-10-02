import { defineCard } from "../define.js";

// Commander backlog (top-commanders.txt). Elesh Norn, Mother of Machines's
// doubling half: any permanent entering, whoever controls it; only Yarok's
// controller's triggered abilities (2019-07-12 rulings), Yarok's own entry
// and anything entering alongside it included. Each instance makes its own
// choices; the two are the same ability, so their order among themselves
// isn't asked.
const DOUBLE_TEXT =
  "If a permanent entering causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.";

export default defineCard({
  name: "Yarok, the Desecrated",
  manaCost: "{2}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Horror"],
  power: 3,
  toughness: 5,
  keywords: ["deathtouch", "lifelink"],
  text: `Deathtouch, lifelink\n${DOUBLE_TEXT}`,
  static: [{ affects: { scope: "self" }, doubleTriggers: { cause: "enters" }, text: DOUBLE_TEXT }],
});
