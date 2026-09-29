import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const MANA_TEXT = 'Tokens you control have "{T}: Add {G}."';

// Every token, not only creatures (the ruling); a creature token still
// waits out its summoning sickness to tap for it.
export default defineCard({
  name: "Jaheira, Friend of the Forest",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Elf", "Druid"],
  power: 2,
  toughness: 3,
  pairing: { kind: "choose-a-background" },
  text: `${MANA_TEXT}\nChoose a Background (You can have a Background as a second commander.)`,
  static: [
    {
      affects: { scope: "filter", filter: { token: true, controlledBy: "you" } },
      grantsActivated: [addManaAbility({ mana: "G", text: "{T}: Add {G}." })],
      text: MANA_TEXT,
    },
  ],
});
