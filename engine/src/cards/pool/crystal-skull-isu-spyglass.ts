import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// Historic is artifact, legendary or Saga (the reminder text). Looking at the
// top card any time is for its controller alone (rule 401.5); a historic land
// is played with the land drop, a historic spell cast paying every cost and
// keeping its timing (the rulings).
const HISTORIC = { anyOf: [{ type: "artifact" as const }, { supertype: "legendary" as const }, { subtype: "Saga" }] };
const LOOK_TEXT = "You may look at the top card of your library any time.";
const PLAY_TEXT =
  "You may play historic lands and cast historic spells from the top of your library. (Artifacts, legendaries, and Sagas are historic.)";

export default defineCard({
  name: "Crystal Skull, Isu Spyglass",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${LOOK_TEXT}\n${PLAY_TEXT}\n{T}: Add {U}.`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      playFromLibraryTop: { type: "land", ...HISTORIC },
      castFromLibraryTop: { filter: HISTORIC },
      text: PLAY_TEXT,
    },
  ],
  activated: [addManaAbility({ mana: "U", text: "{T}: Add {U}." })],
});
