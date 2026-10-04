import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 5160.
//
// Rulings:
//   [2022-12-02] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.
//   [2022-12-02] If an Aura is exiled this way, its owner chooses what it will enchant as it
//     returns to the battlefield. An Aura put onto the battlefield this way doesn't target
//     anything (so it could be attached to a permanent with shroud, for example), but the Aura's
//     enchant ability restricts what it can be attached to. If the Aura can't legally be attached
//     to anything, it remains in exile for the rest of the game.
//   [2022-12-02] If Chains of Custody leaves the battlefield before its second ability resolves,
//     the target permanent won't be exiled.
//   [2022-12-02] Auras attached to the exiled permanent will be put into their owners' graveyards.
//     Any Equipment will become unattached and remain on the battlefield. Any counters on the
//     exiled permanent will cease to exist. When the card returns to the battlefield, it will be a
//     new object with no connection to the card that was exiled.

// Sheltered by Ghosts' shape.
const EXILE_TEXT =
  "When this Aura enters, exile target nonland permanent an opponent controls until this Aura leaves the battlefield.";
const WARD_TEXT = "Enchanted creature has ward {2}.";

export default defineCard({
  name: "Chains of Custody",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature you control\n${EXILE_TEXT}\n${WARD_TEXT} (Whenever it becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)`,
  targets: ["creature-you-control"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["nonland-permanent-an-opponent-controls"],
      effect: { kind: "exile", target: 0, untilSourceLeaves: true },
      resolve: null,
      text: EXILE_TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "return-exiled-by-source" },
      resolve: null,
      text: "When this Aura leaves the battlefield, return the exiled card.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantsTriggered: [ward({ mana: "{2}" })],
      text: WARD_TEXT,
    },
  ],
});
