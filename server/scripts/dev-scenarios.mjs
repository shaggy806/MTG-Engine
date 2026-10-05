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
//               main, one per turn; `target` a player id, or the name of a
//               permanent to aim at)

export const COMMANDERS = {
  alice: "Krenko, Mob Boss",
  bob: "Emmara, Soul of the Accord",
  carol: "Edgar Markov",
  dave: "Atraxa, Praetors' Voice",
};

/** EXILE's and EXIL4's board: alice's ways of exiling from the top of a
 * library, with mana for all of them. Her library is stacked so a cascade
 * exiles a few lands before it finds Divination. */
const EXILE_BOARD = {
  lands: { alice: 15, bob: 3, carol: 3, dave: 3 },
  battlefield: {
    alice: ["Mystic Forge", "Ulamog, the Ceaseless Hunger", "Pako, Arcane Retriever"],
  },
  hand: { alice: ["Reckless Impulse", "Bloodbraid Elf", "Outrageous Robbery", "Watcher for Tomorrow"] },
  setup(game) {
    // Each goes on top, so the last spawned is the top card.
    for (const name of ["Forest", "Island", "Swamp", "Divination", "Plains", "Mountain", "Island", "Forest"]) {
      game.debugSpawn(name, "alice", "library");
    }
  },
};

/** A `setup` that puts `player`'s opening hand of basics back into their
 * library, leaving only the scenario's cards in hand: few enough to pass the
 * turn without discarding to hand size first. */
const handOfSpellsOnly = (player) => (game) => {
  const basics = ["Plains", "Island", "Swamp", "Mountain", "Forest"];
  for (const id of [...game.state.zones.perPlayer[player].hand]) {
    if (basics.includes(game.state.objects[id].cardName)) game.moveObject(id, "library");
  }
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

  HORDB: {
    about:
      "2p. Blocking a token stack: pass the turn and bob attacks with a stack of six Goblin " +
      "tokens (woken into six attackers, one board tile). Block several of them with the " +
      "Grizzly Bears, the Hill Giant, alice's three Soldier tokens (separate objects the " +
      "board folds) and some of her ten Zombie tokens (one compacted engine stack). On her " +
      "next turn, attack with part of the Zombie stack.",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 5 },
    battlefield: {
      alice: ["Grizzly Bears", "Grizzly Bears", "Hill Giant"],
    },
    setup(game) {
      game.debugApplyEffect("bob", { kind: "create-token", token: "Goblin Token", count: 6 });
      game.debugApplyEffect("alice", { kind: "create-token", token: "Soldier Token", count: 3 });
      game.debugApplyEffect("alice", { kind: "create-token", token: "Zombie Token", count: 10 });
    },
    bots: { bob: { attack: "alice" } },
  },

  ENTAT: {
    about:
      "4p. Tokens that enter tapped and attacking (rule 508.4): attack with alice's Leonin " +
      "Warleader, Hanweir Garrison, Adeline and General Kreat. Their tokens ask what each " +
      "attacks; Adeline's ask only for carol, the one opponent with a planeswalker.",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 6, bob: 3, carol: 3, dave: 3 },
    battlefield: {
      alice: [
        "Leonin Warleader", "Hanweir Garrison", "Adeline, Resplendent Cathar",
        "General Kreat, the Boltbringer",
      ],
      carol: ["Garruk Wildspeaker"],
    },
    bots: { bob: {}, carol: {}, dave: {} },
  },

  MYRAD: {
    about:
      "4p. Cards put onto the battlefield attacking, and myriad: attack bob with Kaalia (an " +
      "Angel from hand joins, attacking him), Goldlust Triad (myriad asks about carol and dave " +
      "in turn; its copies go at end of combat) and a Grizzly Bears (Winota looks at the top six " +
      "and finds a Human).",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 6, bob: 3, carol: 3, dave: 3 },
    battlefield: {
      alice: [
        "Kaalia of the Vast", "Goldlust Triad", "Winota, Joiner of Forces", "Grizzly Bears",
      ],
    },
    hand: { alice: ["Serra Angel"] },
    setup(game) {
      game.debugSpawn("Skyknight Vanguard", "alice", "library");
    },
    bots: { bob: {}, carol: {}, dave: {} },
  },

  ZNNYA: {
    about:
      "2p. Zinnia, Valley's Voice grants offspring {2} to creature spells: each creature in " +
      "alice's hand offers an offspring cast, and Agate Instigator (offspring of its own) can " +
      "pay both.",
    players: ["alice", "bob"],
    lands: { alice: 8, bob: 3 },
    battlefield: { alice: ["Zinnia, Valley's Voice", "Llanowar Elves"] },
    hand: { alice: ["Grizzly Bears", "Agate Instigator"] },
    bots: { bob: {} },
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

  DEEPS: {
    about:
      "2p. A deep stack to watch resolve: bob has two Terror of the Peaks and casts " +
      "Hornet Queen on his turn (pass yours). The Queen and her four Insects entering trigger " +
      "both Terrors each time — ten targeted triggers, each its own stack entry, more than the " +
      "stack fans out (it stops spreading at depth 7). A bug report (2026-10-04): the stack " +
      "didn't shift forward as entries resolved until all the visible ones were gone.",
    players: ["alice","bob"],
    lands: { alice: 5, bob: 1 },
    // Hornet Queen wants {G}{G}{G}: the basics `lands` deals cycle through all five.
    battlefield: { bob: ["Terror of the Peaks", "Terror of the Peaks", ...Array(7).fill("Forest")] },
    hand: { bob: ["Hornet Queen"] },
    bots: { bob: { casts: [{ name: "Hornet Queen" }] } },
  },

  DEEP4: {
    about:
      "4p. A deep stack to watch resolve: bob has two Terror of the Peaks and casts " +
      "Hornet Queen on his turn (pass yours). The Queen and her four Insects entering trigger " +
      "both Terrors each time — ten targeted triggers, each its own stack entry, more than the " +
      "stack fans out (it stops spreading at depth 7). A bug report (2026-10-04): the stack " +
      "didn't shift forward as entries resolved until all the visible ones were gone.",
    players: ["alice","bob","carol","dave"],
    lands: { alice: 5, bob: 1, carol: 5, dave: 5 },
    // Hornet Queen wants {G}{G}{G}: the basics `lands` deals cycle through all five.
    battlefield: { bob: ["Terror of the Peaks", "Terror of the Peaks", ...Array(7).fill("Forest")] },
    hand: { bob: ["Hornet Queen"] },
    bots: { bob: { casts: [{ name: "Hornet Queen" }] }, carol: {}, dave: {} },
  },

  ADVNT: {
    about:
      "2p. Cards that are two spells: an adventurer (Smaug, the Great Calamity, its Adventure Spew " +
      "Flame) and an omen card (Bloomvine Regent, its Omen Claim Territory) in alice's hand. Each " +
      "card shows its spell half at the top of its text box (a bug report, 2026-10-04: only the " +
      "creature's text was shown).",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 5 },
    hand: { alice: ["Smaug, the Great Calamity", "Bloomvine Regent", "Grizzly Bears"] },
    bots: { bob: {} },
  },

  TREES: {
    about:
      "2p. Counters on each token of a stack keep it one stack: alice has a stack of ten " +
      "Warrior tokens and Tribute to the World Tree. Cast Secure the Wastes for 3: the three " +
      "new Warriors fold into the stack as they enter, Tribute triggers once for each and " +
      "puts two +1/+1 counters on one Warrior at a time, and the three end up one tile (x3, " +
      "+1/+1 2) beside the untouched ten.",
    players: ["alice", "bob"],
    lands: { alice: 8, bob: 5 },
    hand: { alice: ["Secure the Wastes"] },
    setup(game) {
      // Real tokens, made the way a card makes them: ten compact into one stack.
      // Tribute arrives after them, so they didn't trigger it.
      game.debugApplyEffect("alice", { kind: "create-token", token: "Warrior Token", count: 10 });
      game.debugSpawn("Tribute to the World Tree", "alice", "battlefield");
    },
    bots: { bob: {} },
  },

  TREE4: {
    about:
      "4p. Tribute to the World Tree with every Warrior entering: cast Secure the Wastes for " +
      "10, Tribute triggers ten times and puts two +1/+1 counters on each Warrior in turn, " +
      "and the ten end up one stack tile (x10, +1/+1 2) once the last trigger resolves.",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 12, bob: 5, carol: 5, dave: 5 },
    battlefield: { alice: ["Tribute to the World Tree"] },
    hand: { alice: ["Secure the Wastes"] },
    bots: { bob: {}, carol: {}, dave: {} },
  },

  POPUL: {
    about:
      "2p. Choices made on the board as an ability resolves: activate Trostani, Selesnya's " +
      "Voice's populate ({1}{G}{W}, T) and choose which of alice's two different creature " +
      "tokens (an Elephant, a Soldier) to copy; cast Abdel Adrian, Gorion's Ward and choose " +
      "any number of her other nonland permanents (Sol Ring, Grizzly Bears) to exile — a " +
      "Soldier for each.",
    players: ["alice", "bob"],
    lands: { alice: 10, bob: 5 },
    battlefield: { alice: ["Trostani, Selesnya's Voice", "Sol Ring", "Grizzly Bears"] },
    hand: { alice: ["Abdel Adrian, Gorion's Ward"] },
    setup(game) {
      game.debugApplyEffect("alice", { kind: "create-token", token: "Elephant Token", count: 1 });
      game.debugApplyEffect("alice", { kind: "create-token", token: "Soldier Token", count: 1 });
    },
    bots: { bob: {} },
  },

  POPU4: {
    about:
      "4p. POPUL at four players: Trostani's populate between an Elephant and a Soldier token, " +
      "and Abdel Adrian's exile of any number of other nonland permanents.",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 10, bob: 5, carol: 5, dave: 5 },
    battlefield: { alice: ["Trostani, Selesnya's Voice", "Sol Ring", "Grizzly Bears"] },
    hand: { alice: ["Abdel Adrian, Gorion's Ward"] },
    setup(game) {
      game.debugApplyEffect("alice", { kind: "create-token", token: "Elephant Token", count: 1 });
      game.debugApplyEffect("alice", { kind: "create-token", token: "Soldier Token", count: 1 });
    },
    bots: { bob: {}, carol: {}, dave: {} },
  },

  HARMN: {
    about:
      "2p. Harmonize: Zenith Festival in alice's graveyard, three Mountains and an untapped " +
      "Hill Giant beside a tapped Craw Wurm. The graveyard viewer offers a harmonize cast " +
      "tapping nothing and one tapping the Giant (−3) — not the tapped Wurm. Tapping the " +
      "Giant, X=4 costs {1}{R}{R}.",
    players: ["alice", "bob"],
    battlefield: { alice: ["Mountain", "Mountain", "Mountain", "Hill Giant", "Craw Wurm"], bob: ["Plains"] },
    setup(game, ids) {
      game.state.objects[ids.alice[4]].tapped = true;
      game.debugSpawn("Zenith Festival", "alice", "graveyard");
    },
    bots: { bob: {} },
  },

  CURSE: {
    about:
      "3p. Curses: Curse of Opulence and Curse of Verbosity in alice's hand. Cast one at carol " +
      "(click her panel): it sits on alice's board flagged \"→ carol\", with its art chip on " +
      "carol's panel. On bob's turn the bot attacks carol with both Grizzly Bears — one trigger: " +
      "alice and bob each get a Gold token (or draw), carol nothing.",
    players: ["alice", "bob", "carol"],
    lands: { alice: 6 },
    battlefield: { bob: ["Grizzly Bears", "Grizzly Bears"] },
    hand: { alice: ["Curse of Opulence", "Curse of Verbosity"] },
    setup: handOfSpellsOnly("alice"),
    bots: { bob: { attack: "carol" }, carol: {} },
  },

  CRSRT: {
    about:
      "2p. A Curse entering without being cast (rule 303.4f): Murder alice's Archon of Falling " +
      "Stars and return the Curse of Verbosity in her graveyard with its trigger — the banner " +
      "asks for the player it enchants, and the players' panels light up.",
    players: ["alice", "bob"],
    battlefield: { alice: ["Archon of Falling Stars", "Swamp", "Swamp", "Swamp"] },
    hand: { alice: ["Murder"] },
    setup: (game) => {
      game.debugSpawn("Curse of Verbosity", "alice", "graveyard");
    },
    bots: { bob: {} },
  },

  BLITZ: {
    about:
      "2p. Blitz: Star Athlete in alice's hand with four Mountains, so it's offered for " +
      "{1}{R}{R} and \"(blitz)\" for {3}{R}; blitzed, it attacks at once (haste) and its " +
      "attack trigger asks bob whether to sacrifice his Hill Giant or take 5.",
    players: ["alice", "bob"],
    battlefield: { alice: ["Mountain", "Mountain", "Mountain", "Mountain"], bob: ["Hill Giant"] },
    hand: { alice: ["Star Athlete"] },
    bots: { bob: {} },
  },

  CAESR: {
    about:
      "2p. Caesar, Legion's Emperor: attack with Caesar and say yes to sacrificing another " +
      "creature (the Grizzly Bears); a reflexive ability then asks for two of its three modes " +
      "as it goes on the stack — two hasty Soldiers tapped and attacking, a card for 1 life, " +
      "damage to bob equal to alice's creature tokens.",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 5 },
    battlefield: { alice: ["Caesar, Legion's Emperor", "Grizzly Bears"] },
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
        "Atraxa, Praetors' Voice", "Morophon, the Boundless",
      ],
      bob: [
        "Garruk Wildspeaker", "Chandra, Acolyte of Flame", "Ajani, Caller of the Pride",
        "Elspeth, Sun's Champion", "Kiora, Behemoth Beckoner",
      ],
    },
    bots: { bob: {} },
  },

  COUNT: {
    about:
      "2p. Permanents carrying counters, for the counter chips on a board tile: +1/+1 on the " +
      "Bears, −1/−1 on the Hill Giant, three kinds on one Serra Angel (+1/+1 and two keyword " +
      "counters), charge on a Sol Ring (no P/T badge), a kind with no glyph (quest) on the " +
      "Elves, and a planeswalker whose loyalty stays on its shield.",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 5 },
    battlefield: {
      alice: ["Grizzly Bears", "Hill Giant", "Serra Angel", "Sol Ring", "Llanowar Elves"],
      bob: ["Garruk Wildspeaker", "Colossal Dreadmaw"],
    },
    setup(game, ids) {
      const put = (player, id, counter, amount) =>
        game.debugApplyEffect(player, { kind: "add-counter", target: "source", counter, amount }, [], {
          source: id,
        });
      const [bears, giant, angel, ring, elves] = ids.alice;
      put("alice", bears, "+1/+1", 2);
      put("alice", giant, "-1/-1", 1);
      put("alice", angel, "+1/+1", 3);
      put("alice", angel, "flying", 1);
      put("alice", angel, "lifelink", 1);
      put("alice", ring, "charge", 4);
      put("alice", elves, "quest", 12);
      put("bob", ids.bob[1], "+1/+1", 5);
    },
    bots: { bob: {} },
  },

  TAPCS: {
    about:
      "2p. Costs that tap other permanents, for picking what to tap: Selesnya Evangel taps one " +
      "creature (an Angel, the Elves, or one of a stack of nine Zombie tokens), and Sephara's " +
      "alternative cost in hand taps four of five fliers. The Elves are the only creature that " +
      "makes mana, so they're offered to tap only while a land can pay Evangel's {1}.",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 5 },
    battlefield: {
      alice: [
        "Selesnya Evangel", "Llanowar Elves",
        "Serra Angel", "Serra Angel", "Serra Angel", "Serra Angel", "Serra Angel",
      ],
    },
    hand: { alice: ["Sephara, Sky's Blade"] },
    setup(game) {
      // Real tokens, made the way a card makes them: nine compact into one stack.
      game.debugApplyEffect("alice", { kind: "create-token", token: "Zombie Token", count: 9 });
    },
    bots: { bob: {} },
  },
  MULDR: {
    about:
      "2p. Muldrotha, the Gravetide with a graveyard to play from, for the graveyard viewer's " +
      "one-button-per-way: Darksteel Myr (an artifact creature, castable as either type), " +
      "Grizzly Bears (one way), Forest and Fell the Profane (its land face, Fell Mire).",
    players: ["alice", "bob"],
    lands: { alice: 10, bob: 5 },
    battlefield: { alice: ["Muldrotha, the Gravetide"], bob: ["Grizzly Bears"] },
    setup(game) {
      for (const name of ["Darksteel Myr", "Grizzly Bears", "Forest", "Fell the Profane"]) {
        game.debugSpawn(name, "alice", "graveyard");
      }
    },
    bots: { bob: {} },
  },

  MULD4: {
    about: "4p. MULDR's board for alice, in the quadrant layout.",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 10, bob: 5, carol: 5, dave: 5 },
    battlefield: { alice: ["Muldrotha, the Gravetide"], bob: ["Grizzly Bears"] },
    setup(game) {
      for (const name of ["Darksteel Myr", "Grizzly Bears", "Forest", "Fell the Profane"]) {
        game.debugSpawn(name, "alice", "graveyard");
      }
    },
    bots: { bob: {}, carol: {}, dave: {} },
  },

  TOPLB: {
    about:
      "2p. Oracle of Mul Daya with a Forest revealed on top of alice's library, to play from " +
      "the library rail, and Summon: Titan (a Saga creature) in her hand.",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 5 },
    battlefield: { alice: ["Oracle of Mul Daya"], bob: ["Grizzly Bears"] },
    hand: { alice: ["Summon: Titan"] },
    setup(game) {
      game.debugSpawn("Forest", "alice", "library");
    },
    bots: { bob: {} },
  },

  TOPL4: {
    about: "4p. TOPLB's board for alice, in the quadrant layout.",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 5, bob: 5, carol: 5, dave: 5 },
    battlefield: { alice: ["Oracle of Mul Daya"], bob: ["Grizzly Bears"] },
    hand: { alice: ["Summon: Titan"] },
    setup(game) {
      game.debugSpawn("Forest", "alice", "library");
    },
    bots: { bob: {}, carol: {}, dave: {} },
  },

  DISCD: {
    about:
      "2p. Discard as an activation cost: Tortured Existence and Fauna Shaman want a creature " +
      "card, so only the two creatures in alice's hand light up and a land can't be picked.",
    players: ["alice", "bob"],
    lands: { alice: 5, bob: 3 },
    battlefield: { alice: ["Tortured Existence", "Fauna Shaman"] },
    hand: { alice: ["Grizzly Bears", "Hill Giant", "Forest", "Island"] },
    setup(game) {
      game.debugSpawn("Llanowar Elves", "alice", "graveyard");
    },
    bots: { bob: {} },
  },

  DISC4: {
    about: "4p. DISCD's board for alice, in the quadrant layout.",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 5, bob: 3, carol: 3, dave: 3 },
    battlefield: { alice: ["Tortured Existence", "Fauna Shaman"] },
    hand: { alice: ["Grizzly Bears", "Hill Giant", "Forest", "Island"] },
    setup(game) {
      game.debugSpawn("Llanowar Elves", "alice", "graveyard");
    },
    bots: { bob: {}, carol: {}, dave: {} },
  },

  CASTN: {
    about:
      "2p. Casting a spell as another resolves (the cast-now popup): Baral's Expertise offers " +
      "the cheap spells in alice's hand free (Orim's Chant kicked or not), and attacking with " +
      "Velomachus Lorehold shows her the top seven of her library to cast an instant or " +
      "sorcery from.",
    players: ["alice", "bob"],
    lands: { alice: 8, bob: 3 },
    battlefield: { alice: ["Velomachus Lorehold"], bob: ["Grizzly Bears", "Hill Giant"] },
    hand: { alice: ["Baral's Expertise", "Divination", "Lightning Bolt", "Opt", "Orim's Chant", "Shivan Dragon"] },
    setup(game) {
      // Put on top of the library in reverse, so Lightning Bolt ends up on top.
      for (const name of ["Counterspell", "Opt", "Lava Spike", "Island", "Divination", "Shivan Dragon", "Lightning Bolt"]) {
        game.debugSpawn(name, "alice", "library");
      }
    },
    bots: { bob: {} },
  },

  CAST4: {
    about: "4p. CASTN's board for alice, in the quadrant layout.",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 8, bob: 3, carol: 3, dave: 3 },
    battlefield: { alice: ["Velomachus Lorehold"], bob: ["Grizzly Bears", "Hill Giant"] },
    hand: { alice: ["Baral's Expertise", "Divination", "Lightning Bolt", "Opt", "Orim's Chant", "Shivan Dragon"] },
    setup(game) {
      for (const name of ["Counterspell", "Opt", "Lava Spike", "Island", "Divination", "Shivan Dragon", "Lightning Bolt"]) {
        game.debugSpawn(name, "alice", "library");
      }
    },
    bots: { bob: {}, carol: {}, dave: {} },
  },

  ARRWS: {
    about:
      "2p. Arrows as things resolve: Lightning Bolt (a creature or bob), Murder, Prey Upon " +
      "(two targets: the Dreadmaw fights one of bob's creatures) and Prodigal Pyromancer's " +
      "ping, each pointing at what it hits as it leaves the stack, and Counterspell (cast " +
      "the Bolt, then counter it: the arrow loops round the pile to the Bolt beneath). Pass " +
      "the turn and bob Bolts the Pyromancer.",
    players: ["alice", "bob"],
    lands: { alice: 10, bob: 5 },
    battlefield: {
      alice: ["Prodigal Pyromancer", "Colossal Dreadmaw"],
      bob: ["Grizzly Bears", "Hill Giant", "Serra Angel", "Craw Wurm"],
    },
    hand: { alice: ["Lightning Bolt", "Murder", "Prey Upon", "Counterspell"], bob: ["Lightning Bolt"] },
    setup: handOfSpellsOnly("alice"),
    bots: { bob: { casts: [{ name: "Lightning Bolt", target: "Prodigal Pyromancer" }] } },
  },

  ARRW4: {
    about:
      "4p. ARRWS's arrows in the quadrant layout: alice has Lightning Bolt and the " +
      "Pyromancer; pass the turn and bob Murders carol's Serra Angel, then Bolts alice.",
    players: ["alice", "bob", "carol", "dave"],
    lands: { alice: 6, bob: 10, carol: 3, dave: 3 },
    battlefield: {
      alice: ["Prodigal Pyromancer", "Colossal Dreadmaw"],
      bob: ["Grizzly Bears"],
      carol: ["Serra Angel", "Hill Giant"],
      dave: ["Craw Wurm", "Grizzly Bears"],
    },
    hand: { alice: ["Lightning Bolt"], bob: ["Murder", "Lightning Bolt"] },
    setup: handOfSpellsOnly("alice"),
    bots: {
      bob: {
        casts: [
          { name: "Murder", target: "Serra Angel" },
          { name: "Lightning Bolt", target: "alice" },
        ],
      },
      carol: {},
      dave: {},
    },
  },

  RVLND: {
    about:
      "2p. Reveal lands: play Port Town to be asked which of the Island and Plains in hand " +
      "to reveal, or none (it enters tapped); Game Trail has only a Mountain to show.",
    players: ["alice", "bob"],
    lands: { alice: 3, bob: 3 },
    hand: { alice: ["Port Town", "Game Trail", "Island", "Plains", "Mountain", "Grizzly Bears"] },
    bots: { bob: {} },
  },

  EXILE: {
    about:
      "2p. Exiling from the top of a library, each the way a mill peels: cast Reckless Impulse " +
      "(an impulse draw of two), activate Mystic Forge (the top card), cast Bloodbraid Elf (a " +
      "cascade, one card at a time, into Divination), Outrageous Robbery (bob's top X, face " +
      "down) and Watcher for Tomorrow (hideaway), and attack with Ulamog (bob exiles twenty) " +
      "and Pako (each player's top card).",
    players: ["alice", "bob"],
    ...EXILE_BOARD,
    bots: { bob: {} },
  },

  EXIL4: {
    about: "4p. EXILE's board for alice, in the quadrant layout: Pako takes all four libraries' tops.",
    players: ["alice", "bob", "carol", "dave"],
    ...EXILE_BOARD,
    bots: { bob: {}, carol: {}, dave: {} },
  },
};
