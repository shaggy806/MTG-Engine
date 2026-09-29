import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const SIX_TEXT =
  "{2}{G}{G}, {T}: Add six {G}. Spend this mana only to cast creature spells or activate abilities of creatures.";

// "Abilities of creatures" means creature permanents: the six can't pay for
// a creature card's ability from the hand (the ruling). Its coloured cost
// keeps it off the auto-payer, so it's activated by hand and floats.
export default defineCard({
  name: "Castle Garenbrig",
  colors: [],
  types: ["land"],
  text: `This land enters tapped unless you control a Forest.\n{T}: Add {G}.\n${SIX_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { subtype: "Forest" }, atLeast: 1 },
      },
      text: "This land enters tapped unless you control a Forest.",
    },
  ],
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: "{2}{G}{G}", tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "G",
        amount: 6,
        spendOnly: {
          spell: { type: "creature" },
          abilityOf: { type: "creature" },
          text: "Spend this mana only to cast creature spells or activate abilities of creatures.",
        },
      },
      resolve: null,
      text: SIX_TEXT,
    },
  ],
});
