import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// The spending rule covers every mana cost its controller pays — spells,
// abilities, costs paid as something resolves — but a `{C}` pip still wants
// colourless mana (rule 609.4b: it changes how a cost may be paid, not the
// cost). "Colorless" isn't a colour, so the draw counts at most five (the
// ruling).
const SPEND_TEXT = "You may spend mana as though it were mana of any color.";
const DRAW_TEXT = "{5}, {T}: Draw a card for each color among permanents you control.";

export default defineCard({
  name: "Chromatic Orrery",
  manaCost: "{7}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${SPEND_TEXT}\n{T}: Add {C}{C}{C}{C}{C}.\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      spendManaAs: { as: "any-color" },
      text: SPEND_TEXT,
    },
  ],
  activated: [
    addManaAbility({ mana: "C", amount: 5, text: "{T}: Add {C}{C}{C}{C}{C}." }),
    {
      cost: { mana: "{5}", tap: true },
      targets: [],
      effect: { kind: "draw", amount: { colorsAmong: { controlledBy: "you" } } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
