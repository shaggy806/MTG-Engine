import { defineCard } from "../define.js";
import type { ModeOption } from "../../effects.js";
import type { Color } from "../../mana.js";

// EDHREC rank 5372.
//
// The color is chosen as it resolves — an unannounced `modal`, one mode per
// color (Orcish Medicine's "your choice of" shape). A permanent is returned if
// the chosen color is among its colors as it resolves.
const bounce = (color: Color, word: string): ModeOption => ({
  text: word,
  effect: { kind: "return-to-hand-all", filter: { colors: [color] } },
});

export default defineCard({
  name: "Wash Out",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Return all permanents of the color of your choice to their owners' hands.",
  effect: {
    kind: "modal",
    minModes: 1,
    maxModes: 1,
    modes: [
      bounce("W", "White"),
      bounce("U", "Blue"),
      bounce("B", "Black"),
      bounce("R", "Red"),
      bounce("G", "Green"),
    ],
  },
});
