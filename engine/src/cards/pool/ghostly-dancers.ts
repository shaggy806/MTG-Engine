import { defineCard } from "../define.js";

// EDHREC rank 3721. The enters ability's choice is made as it resolves; the
// enchantment card returned isn't targeted ("an enchantment card").
const ENTER =
  "When this creature enters, return an enchantment card from your graveyard to your hand or unlock a locked door of a Room you control.";
const RETURN_MODE = "Return an enchantment card from your graveyard to your hand.";
const UNLOCK_MODE = "Unlock a locked door of a Room you control.";
const EERIE =
  "Eerie — Whenever an enchantment you control enters and whenever you fully unlock a Room, create a 3/1 white Spirit creature token with flying.";
const SPIRIT = { kind: "create-token", token: "Spirit Token (Ghostly Dancers)", count: 1 } as const;

export default defineCard({
  name: "Ghostly Dancers",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${ENTER}\n${EERIE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: RETURN_MODE,
            effect: {
              kind: "look-and-choose",
              zone: "graveyard",
              min: 1,
              max: 1,
              destination: "hand",
              leftover: "stay",
              filter: { type: "enchantment" },
            },
          },
          { text: UNLOCK_MODE, effect: { kind: "unlock-door" } },
        ],
      },
      resolve: null,
      text: ENTER,
    },
    { trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } }, targets: [], effect: SPIRIT, resolve: null, text: EERIE },
    { trigger: { on: "door-unlocked", who: "you-control", fully: true }, sameAbilityAs: 1, targets: [], effect: SPIRIT, resolve: null, text: EERIE },
  ],
});
