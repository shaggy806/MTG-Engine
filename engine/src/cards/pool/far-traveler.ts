import { defineCard } from "../define.js";

// EDHREC rank 4744.
//
// Rulings:
//   [2022-06-10] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.
//   [2022-06-10] When the card returns to the battlefield, it will be a new object with no
//     connection to the card that was exiled. Auras attached to the exiled creature will be put
//     into their owners' graveyards. Any Equipment will become unattached and remain on the
//     battlefield. Any counters on the exiled permanent will cease to exist.
// Tavern Brawler's granted trigger, with a targeted blink (`flicker` returns
// under its owner's control).
const GRANTED_TEXT =
  "At the beginning of your end step, exile up to one target tapped creature you control, then return it to the battlefield under its owner's control.";
const TEXT = `Commander creatures you own have "${GRANTED_TEXT}"`;

export default defineCard({
  name: "Far Traveler",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Background"],
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", isCommander: true, ownedBy: "you" } },
      grantsTriggered: [
        {
          trigger: { on: "step-begins", step: "end", who: "you" },
          targets: [
            { kind: "optional", of: { kind: "permanent", whose: "you", filter: { type: "creature", tapped: true } } },
          ],
          effect: { kind: "flicker", target: 0 },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: TEXT,
    },
  ],
});
