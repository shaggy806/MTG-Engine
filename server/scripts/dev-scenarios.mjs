// Board states for `npm run dev-rooms -w server` (scripts/dev-rooms.mjs), one
// room per entry, keyed by the room code a browser joins with
// `?room=CODE`. Codes are five characters from the room alphabet
// (A-Z without I/O, 2-9).
//
// Every scenario starts on turn 1 with the first player at `start` (default
// "precombat-main") holding priority. The first player is the human seat;
// everyone listed under `bots` is a scripted bot (see `ScriptedBot` in
// dev-rooms.mjs), and any other player is a second human seat.
//
//   players     seating order; commanders default per seat (COMMANDERS)
//   lands       basics per player, mixed colours, untapped
//   battlefield card names per player, untapped and not summoning sick
//   hand        card names put into a player's hand
//   life        starting life per player (default: 40)
//   setup       (game, ids) => void, for anything the fields above can't
//               say; `ids[player]` is that player's `battlefield` object ids,
//               in the order listed
//   bots        per bot: `attack` (a player id: attack it with everything
//               that can), `block` ({ attacker, with }: block that attacker
//               with every untapped creature of that name, or of any name in a
//               list), `casts` ([{ name, target }]: cast on its own precombat
//               main, one per turn)

export const COMMANDERS = {
  alice: "Krenko, Mob Boss",
  bob: "Emmara, Soul of the Accord",
  carol: "Edgar Markov",
  dave: "Atraxa, Praetors' Voice",
};

export default {
  TWOAA: {
    about:
      "2p. Five attackers with one legal defender each. Bob double-blocks a Dreadmaw attack " +
      "with Grizzly Bears, then on his turn casts Diabolic Edict at alice and attacks her.",
    players: ["alice", "bob"],
    lands: { alice: 8, bob: 10 },
    battlefield: {
      alice: ["Grizzly Bears", "Grizzly Bears", "Colossal Dreadmaw", "Serra Angel", "Hill Giant"],
      bob: ["Grizzly Bears", "Grizzly Bears", "Craw Wurm"],
    },
    hand: { bob: ["Diabolic Edict"] },
    bots: {
      bob: {
        block: { attacker: "Colossal Dreadmaw", with: "Grizzly Bears" },
        casts: [{ name: "Diabolic Edict", target: "alice" }],
        attack: "alice",
      },
    },
  },

  SWARM: {
    about:
      "2p. A crowd of mostly different creatures blocking one attacker, for the damage " +
      "assignment's scrolling list: attack with the trampling Colossal Dreadmaw and bob " +
      "blocks it with four Grizzly Bears and twelve others, no two alike.",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 5 },
    battlefield: {
      alice: ["Colossal Dreadmaw"],
      bob: [
        ...Array(4).fill("Grizzly Bears"),
        "Hill Giant", "Craw Wurm", "Serra Angel", "Giant Spider", "Typhoid Rats",
        "Wall of Wood", "Raging Goblin", "Boggart Brute", "Darksteel Myr",
        "Rumbling Baloth", "Kobolds of Kher Keep", "Vampire Nighthawk",
      ],
    },
    bots: {
      bob: {
        block: {
          attacker: "Colossal Dreadmaw",
          with: [
            "Grizzly Bears", "Hill Giant", "Craw Wurm", "Serra Angel", "Giant Spider",
            "Typhoid Rats", "Wall of Wood", "Raging Goblin", "Boggart Brute", "Darksteel Myr",
            "Rumbling Baloth", "Kobolds of Kher Keep", "Vampire Nighthawk",
          ],
        },
      },
    },
  },

  HORDE: {
    about:
      "2p. A token stack and a few others blocking one attacker: attack with the Colossal " +
      "Dreadmaw and bob blocks it with a stack of twenty Goblin tokens, two Grizzly Bears " +
      "and a Hill Giant.",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 5 },
    battlefield: {
      alice: ["Colossal Dreadmaw"],
      bob: ["Grizzly Bears", "Grizzly Bears", "Hill Giant"],
    },
    setup(game) {
      // Real tokens, made the way a card makes them: twenty compact into one stack.
      game.debugApplyEffect("bob", { kind: "create-token", token: "Goblin Token", count: 20 });
    },
    bots: {
      bob: {
        block: {
          attacker: "Colossal Dreadmaw",
          with: ["Goblin Token", "Grizzly Bears", "Hill Giant"],
        },
      },
    },
  },

  HORDE4: {
    about:
      "4p. HORDE from the bottom-right seat, whose quadrant the decision panel floats " +
      "over: attack dave with the Colossal Dreadmaw and he blocks with a stack of twenty " +
      "Goblin tokens, two Grizzly Bears and a Hill Giant.",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 5, bob: 5, carol: 5, dave: 5 },
    battlefield: {
      alice: ["Colossal Dreadmaw"],
      dave: ["Grizzly Bears", "Grizzly Bears", "Hill Giant"],
    },
    setup(game) {
      game.debugApplyEffect("dave", { kind: "create-token", token: "Goblin Token", count: 20 });
    },
    bots: {
      bob: {},
      carol: {},
      dave: {
        block: {
          attacker: "Colossal Dreadmaw",
          with: ["Goblin Token", "Grizzly Bears", "Hill Giant"],
        },
      },
    },
  },

  TWOPW: {
    about: "2p. Bob has a planeswalker, so every attacker has two legal defenders.",
    players: ["alice", "bob"],
    lands: { alice: 8, bob: 10 },
    battlefield: {
      alice: ["Grizzly Bears", "Grizzly Bears", "Colossal Dreadmaw", "Serra Angel"],
      bob: ["Garruk Wildspeaker", "Craw Wurm"],
    },
    bots: { bob: {} },
  },

  FOURP: {
    about:
      "4p. Goad makes the legal defenders differ per attacker: Hill Giant is goaded by bob, " +
      "Craw Wurm by carol and dave (so the two share no target). Every opponent has a " +
      "planeswalker. Bob edicts alice and attacks her; carol attacks dave.",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 8, bob: 10, carol: 10, dave: 10 },
    battlefield: {
      alice: ["Grizzly Bears", "Hill Giant", "Craw Wurm", "Serra Angel", "Colossal Dreadmaw"],
      bob: ["Garruk Wildspeaker", "Grizzly Bears"],
      carol: ["Chandra, Acolyte of Flame", "Craw Wurm"],
      dave: ["Ajani, Caller of the Pride", "Hill Giant"],
    },
    hand: { bob: ["Diabolic Edict"] },
    setup(game, ids) {
      const [, giant, wurm] = ids.alice;
      game.state.objects[giant].goadedBy = ["bob"];
      game.state.objects[wurm].goadedBy = ["carol", "dave"];
    },
    bots: {
      bob: { casts: [{ name: "Diabolic Edict", target: "alice" }], attack: "alice" },
      carol: { attack: "dave" },
      dave: {},
    },
  },

  STACK: {
    about:
      "2p. Token makers in alice's hand, to cast for real: debugSpawn only ever makes nontoken " +
      "objects, so it can't show how the board folds tokens. White Sun's Zenith for 8 or more " +
      "is one engine stack (stackCount), Raise the Alarm's two Soldiers are two objects the board " +
      "folds into one tile, and Jump on one Cat splits it off the stack with flying.",
    players: ["alice", "bob"],
    lands: { alice: 30, bob: 5 },
    hand: { alice: ["White Sun's Zenith", "Raise the Alarm", "Jump"] },
    bots: { bob: {} },
  },

  LURES: {
    about:
      "2p. Bob attacks alice with a Lure-enchanted Hill Giant and a Grizzly Bears. Every " +
      "creature of alice's able to block the Giant has to, so the block bar holds Block " +
      "until Serra Angel and both Grizzly Bears are on it; her Craw Wurm is tapped, so it " +
      "isn't able to and is exempt.",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 5 },
    battlefield: {
      alice: ["Grizzly Bears", "Grizzly Bears", "Serra Angel", "Craw Wurm"],
      bob: ["Hill Giant", "Grizzly Bears", "Lure"],
    },
    setup(game, ids) {
      const [giant, , lure] = ids.bob;
      game.state.objects[lure].attachedTo = giant;
      game.state.objects[ids.alice[3]].tapped = true;
    },
    bots: { bob: { attack: "alice" } },
  },

  KWALL: {
    about:
      "2p. One permanent per keyword the pool uses, and all five pool planeswalkers, " +
      "for checking keyword icons and loyalty badges at a glance.",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 5 },
    battlefield: {
      alice: [
        "Serra Angel", "Ambush Viper", "Boggart Brute", "Bloodbraid Elf", "Giant Spider",
        "Dragonkin Berserker", "Combat Thresher", "Brash Taunter", "Carnage Tyrant",
        "Hornet Nest", "Invisible Stalker", "Vela the Night-Clad", "Harvesttide Infiltrator",
        "Atraxa, Praetors' Voice",
      ],
      bob: [
        "Garruk Wildspeaker", "Chandra, Acolyte of Flame", "Ajani, Caller of the Pride",
        "Elspeth, Sun's Champion", "Kiora, Behemoth Beckoner",
      ],
    },
    bots: { bob: {} },
  },
};
