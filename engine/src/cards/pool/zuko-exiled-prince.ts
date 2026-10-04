import { defineCard } from "../define.js";
import { firebending } from "../helpers.js";

// EDHREC rank 4424.
//
// Rulings:
//   [2025-10-02] Mana from firebending abilities isn't lost until you leave combat and go to your
//     second main phase. It can be used at any time during combat, even after combat damage has
//     been dealt.
//   [2025-10-02] You must follow all normal timing rules for a card you play using Zuko, Exiled
//     Prince's last ability and, if it's a spell, you must pay its costs to cast it.
//   [2025-10-02] Firebending abilities aren't mana abilities. They use the stack and can be
//     responded to.

const FIREBENDING_TEXT = "Firebending 3 (Whenever this creature attacks, add {R}{R}{R}. This mana lasts until end of combat.)";

export default defineCard({
  name: "Zuko, Exiled Prince",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 4,
  toughness: 3,
  text: `${FIREBENDING_TEXT}\n{3}: Exile the top card of your library. You may play that card this turn.`,
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{3}: Exile the top card of your library. You may play that card this turn.",
    },
  ],
  triggered: [firebending(3, FIREBENDING_TEXT)],
});
