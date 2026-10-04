import { defineCard } from "../define.js";

// EDHREC rank 5616.
//
// Castle Garenbrig's restriction with the filter swapped: "Time Lord" is one
// creature subtype (the only two-word one), and `subtypes` is an OR. "An
// ability of a Time Lord or Alien" is of a permanent, as Castle Garenbrig's
// "abilities of creatures" is.

const TIME_LORD_OR_ALIEN = { subtypes: ["Time Lord", "Alien"] } as const;
const SPEND_TEXT =
  "Spend this mana only to cast a Time Lord or Alien spell or activate an ability of a Time Lord or Alien.";
const ANY_TEXT = `{T}: Add one mana of any color. ${SPEND_TEXT}`;
const SURVEIL_TEXT = "When Gallifrey Council Chamber enters, surveil 1.";

export default defineCard({
  name: "Gallifrey Council Chamber",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text:
    `${SURVEIL_TEXT} (Look at the top card of your library. You may put that card into your graveyard.)\n` +
    `{T}: Add {C}.\n${ANY_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: { spell: TIME_LORD_OR_ALIEN, abilityOf: TIME_LORD_OR_ALIEN, text: SPEND_TEXT },
      },
      resolve: null,
      text: ANY_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: SURVEIL_TEXT,
    },
  ],
});
