function trimmed(value: number): string {
  return String(Number(value.toFixed(1)));
}

export const STRINGS = {
  document: {
    title: "Jensen Huang Simulator",
  },

  title: {
    jensen: ["JENSEN HUANG", "SIMULATOR"],
    hackclub: ["HACK CLUB", "SIMULATOR"],
    start: "Start",
    settings: "Options",
    secret: "Secret Mode",
    logo: {
      nvidia: "NVIDIA",
      hackclub: "Hack Club",
    },
  },

  hud: {
    summaryTurn: (turn: number) => `Round ${turn}.`,
    quarterLabel: (quarter: number) => `Q${quarter}`,
    progressLabel: (revenue: number, target: number) => `${trimmed(revenue)}/${trimmed(target)}`,
    debt: (boost: number) => `+${Math.round(boost * 100)}%`,
    summaryQuarter: (quarter: number, revenue: number, target: number, left: number) =>
      `Quarter ${quarter}, $${trimmed(revenue)}M of $${trimmed(target)}M, ${left} round${left === 1 ? "" : "s"} left.`,
    stats: {
      money: "Money",
      affairs: "Affairs",
      feds: "Wanted",
      board: "Board",
    },
  },

  amounts: {
    money: (value: number) => `$${trimmed(value)}M`,
    affairs: (count: number) => `${trimmed(count)} AFFAIR${count === 1 ? "" : "S"}`,
    stars: (count: number) => `${count} star${count === 1 ? "" : "s"}`,
    gain: (text: string) => `+${text}`,
  },

  apps: {
    dating: "Dating",
    wechat: "WeChat",
    signal: "Signal",
  },

  settings: {
    title: "OPTIONS",
    back: "Back",
    music: (volume: number) => `Music: ${volume}%`,
    musicName: "Music volume",
    mute: "Mute",
    unmute: "Unmute",
    textSpeed: "Text speed",
    speeds: { slow: "Slow", normal: "Normal", fast: "Fast", instant: "Instant" },
    background: "Moving background",
    on: "On",
    off: "Off",
  },

  endings: {
    feds: {
      headline: "NVIDIA CEO ARRESTED IN LEATHER JACKET",
      story: "Federal agents say the paper trail was \"longer than a GPU backorder.\"",
    },
    board: {
      headline: "NVIDIA BOARD FIRES CEO",
      story: "\"We just stopped believing the more you buy, the more you save,\" said one director.",
    },
    scandal: {
      headline: "NVIDIA BOARD OUSTS CEO OVER AFFAIR",
      story: "\"We tolerate a lot of things,\" said one director. \"A leaked group chat is not one of them.\"",
    },
    newCeo: (name: string) => `NVIDIA NAMES NEW CEO ${name.toUpperCase()}`,
    newCeoStory: "\"Great energy,\" said one director. \"Honestly, he reminds me of someone, but I can't place who.\"",
    newsflash: "NEWSFLASH",
  },

  tutorial: {
    intro: "You are Jensen Huang, NVIDIA CEO. You are very rich, and you own many leather jackets.",
    goal: "Your goal: have as many affairs as possible. Meet quarterly earnings to keep the board happy, and avoid getting investigated by the FBI.",
    money: "Money. Your cash, in millions. It buys your way out of trouble, and the right deals make more of it.",
    affairs: "Affairs. This is your score, so rack them up. Just don't get caught, or the board will oust you.",
    feds: "Wanted level. How much the FBI suspects you. Five stars and you are arrested. Only money makes them forget.",
    earnings: "Quarterly earnings. Earn enough before the six notches run out. Miss two quarters in a row and you are fired.",
    board: "Board confidence. Keep it above zero or you are out.",
  },

  summary: {
    title: "FINAL STATS",
    turns: (count: number) => `Rounds played: ${count}`,
    quarter: (number: number) => `Quarter reached: Q${number}`,
    affairs: (count: number) => `Affairs: ${count}`,
    moneyBoard: (money: string, board: number) => `Money: ${money}   Board: ${board}`,
    wanted: (stars: string) => `Wanted: ${stars}`,
  },

  identities: {
    original: "Jensen Huang",
    beard: "Hensen Juang",
    detective: "Hensen Juang",
    blonde: "Hensen Juang",
    monopoly: "Hensen Juang",
    mustache: "Hensen Juang",
    propeller: "Hensen Juang",
  },

  scenarios: {
    buyer: {
      names: ["DeepSeek", "Qwen", "Kimi"],
      units: ["100", "500", "2,000"],
      text: (name: string, units: string) => `Ling Long says ${name} wants ${units} NVIDIA Blackwell GPUs.`,
      accept: {
        label: "f*ck export restrictions",
        results: [
          "One pallet, zero questions. For now.",
          "Five pallets. Customs has stopped asking.",
          "A whole cargo plane. Somewhere, a compliance officer updates their résumé.",
        ],
      },
      refuse: {
        label: "-1000 social credit",
        result: "Ling Long is disappointed.",
      },
    },
    envelope: {
      texts: [
        "A Chinese company sent you an alarmingly thick envelope.",
        "Another envelope. It is thicker than the last one.",
        "This time it is a suitcase.",
      ],
      accept: {
        label: "Accept",
        results: [
          "You do not count it in front of the courier. It is a lot.",
          "Heavier than last time. You stop asking what it's for.",
          "The suitcase has wheels. That should have been a clue.",
        ],
      },
      refuse: {
        label: "Return it",
        jokes: [
          "You returned the envelope. They sent it back. You returned it again. The courier now knows your schedule.",
          "You returned the envelope unopened. Your assistant is still a little sad about it.",
          "You returned the envelope. Somewhere, a courier shrugs and eats the delivery fee.",
          "You returned the envelope. It was a very thick envelope. You think about it more than you should.",
        ],
      },
    },
    model: {
      text: "Ling Long sent you a Chinese model.",
      sendBack: {
        label: "Send it back",
        result: "The courier is back within the hour. The model, he says, is non-refundable.",
      },
      load: {
        label: "Load it onto a server",
        result: "Your engineers say it was trained on a fraction of your GPUs. The market notices.",
      },
      invite: {
        label: "Invite her up to your office",
        result: "She arrives with a laptop and a very firm handshake. You do not look at the laptop.",
      },
    },
    architecture: {
      text: "Ling Long wants to know about your latest architecture!",
      refuse: {
        label: "Refuse",
        result: "Ling Long says he understands. His tone says he does not.",
      },
      fake: {
        label: "Give them last generation's",
        fooled: "They thank you warmly. It will take them a year to notice.",
        caught: "They notice in about four minutes. This is now a trust issue.",
      },
      tell: {
        label: "Tell them everything",
        result: "They take notes. A lot of notes. You are paid very well for your honesty.",
      },
    },
    dinner: {
      text: "Ling Long invited you to a private dinner. \"Very small. Very quiet.\"",
      decline: {
        label: "Decline",
        result: "You eat at your desk. It is sad, and it is safe.",
      },
      attend: {
        label: "Attend",
        result: "A private room, nine courses, and a seat next to a very interesting executive.",
      },
    },
    fbiPallet: {
      text: "John FBI wants to know what was on the pallet you just sent to China!",
      burgers: {
        label: "McDonalds burgers",
        believed: "He writes \"burgers\" on his clipboard. He does not look convinced, but he leaves.",
        caught: "He asks which McDonald's. It's the one in Shenzhen.",
      },
      amd: {
        label: "AMD Gpus",
        believed: "He believes you, mostly because nobody would lie about AMD.",
        caught: "He pulls up the shipping manifest. It says NVIDIA in very large letters.",
      },
      lawyer: {
        label: "Lawyer up",
        result: "Your lawyer says four words and John FBI goes home. The invoice arrives before he reaches his car.",
      },
    },
    fbiMoney: {
      text: "John FBI wants to know where all that money came from.",
      consulting: {
        label: "Consulting fees",
        believed: "\"For what?\" \"Consulting.\" He writes it down. He writes it down slowly.",
        caught: "He asks which clients. You say \"various.\" He asks which various.",
      },
      aunt: {
        label: "A very generous aunt",
        believed: "He asks for her name. You give him one. He is somehow satisfied.",
        caught: "He has already spoken to your aunt. She has never met you.",
      },
      lawyer: {
        label: "Lawyer up",
        result: "Your lawyer calls it a private family matter. John FBI lets it go. For now.",
      },
    },
    fbiDatingSubpoena: {
      text: "John FBI has a subpoena for your dating app history. All of it.",
      fight: {
        label: "Fight the subpoena",
        result: "Your lawyers bury it in motions. It will be someone else's problem for a while.",
      },
      comply: {
        label: "Comply",
        quiet: "They read it quietly. The board hears about it anyway.",
        leaked: "It leaks within the hour. The board does not wait for the second paragraph.",
      },
    },
    fbiShippingSubpoena: {
      text: "The FBI subpoenaed your shipping records.",
      comply: {
        label: "Comply",
        result: "The records show everything you sent, to everyone, on every date. It is a lot of pallets.",
      },
      fight: {
        label: "Fight it",
        won: "Your lawyers find a clerical error. You are free, and poorer.",
        lost: "Your lawyers lose. You are poorer, and the records go out anyway.",
      },
      shred: {
        label: "Shred them",
        clean: "The shredder works. It is the first time in your career that has been true.",
        caught: "The shredder jams. An agent is reading the strips.",
      },
    },
    fbiQuestions: {
      text: "John FBI is asking a lot of questions. Too many questions.",
      kash: {
        label: "Call up Kash Patel",
        works: "Kash picks up on the second ring. The questions get a lot shorter.",
        backfires: "Kash is not available. The FBI hears you tried to call.",
      },
      altman: {
        label: "Sam Altman them",
        works: "The FBI becomes very interested in a rival lab's data-scraping lawsuits. You get a quiet week.",
        backfires: "Everyone can see you pointing. The FBI notices you pointing.",
      },
    },
    fbiWitness: {
      text: "The FBI found someone willing to testify against you.",
      pay: {
        label: "Pay $40M to silence them",
        result: "The witness remembers some things differently now. You do not ask how.",
      },
      face: {
        label: "Face the music",
        result: "The cuffs are cold. You ask if you can keep the jacket.",
      },
    },
    fbiOpenUp: {
      text: "FBI OPEN UP!!!",
      open: {
        label: "Open up",
        result: "They got a warrant to check your home for stolen government files. They didn't find any - but you hear they're checking Trump next.",
      },
      stay: {
        label: "Don't open up",
        result: "The FBI broke down the door. They don't find anything, but now you have a broken door, and FBI agents who don't trust you.",
      },
    },
    fbiMegaspeed: {
      text: "John FBI: Megaspeed. The executive. Anything you would like to tell us?",
      cooperate: {
        label: "Cooperate",
        result: "You tell them most of it. The board hears all of it.",
      },
      stonewall: {
        label: "Stonewall",
        result: "You say nothing. Loudly, and for a long time. They write it all down.",
      },
      lawyer: {
        label: "Lawyer up",
        result: "Your lawyer asks which executive. John FBI does not have a good answer. This buys you time.",
      },
    },
    lawyer: {
      text: "Your lawyer: we need to talk. $900 an hour.",
      retain: {
        label: "Retain the whole firm",
        result: "The lawyers cost a fortune and fix part of it.",
      },
      wingIt: {
        label: "Wing it",
        result: "You do not need a lawyer. Famous last words.",
      },
    },
    spy: {
      text: "NotAChineseSpy wants to match!",
      yes: {
        label: "Hell yeah",
        result: "It's a match! Her bio just says \"love long walks in datacenters.\"",
      },
      no: {
        label: "Obvious honeypot",
        result: "Swiped left. Somewhere, a very patient intelligence agency sighs.",
      },
    },
    trip: {
      text: "On a business trip, you and a senior VP get a little closer than expected.",
      game: {
        label: "Game is game",
        result: "Life is meant for having fun, and you have a lot of it.",
      },
      hr: {
        label: "Recall your HR training",
        result: "You recall your HR training- something about avoiding manager-employee relationships.",
      },
    },
    employee: {
      text: "An unnamed NVIDIA employee carrying things runs into you at HQ, dropping all of her things on the floor.",
      help: {
        label: "Help her, and take your time",
        result: "You carry her boxes to the 9th floor, taking the scenic route through a supply closet with a lock you have never noticed before.",
      },
      walkPast: {
        label: "Just help her pick things up",
        result: "You help her gather everything, wish her a good day, and head to your meeting. Professional. Boring. Safe.",
      },
    },
    exec: {
      text: "An exec at a Chinese company hits on you, and you think she's kind of hot.",
      pursue: {
        label: "Pursue",
        result: "Exchanged compliments become dinner, and dinner turns into the hotel bar, and the hotel bar turns into several phone calls you do not remember.",
      },
      decline: {
        label: "Politely decline",
        result: "You thank her, but decline her offer to go to dinner. She notices the ring on your wedding finger, realizes, and smiles.",
      },
    },
    hrComplaint: {
      text: "HR: a complaint has been filed about you and an NVIDIA employee.",
      settle: {
        label: "Settle quietly",
        result: "The company lawyers spin up a settlement and a very long nondisclosure agreement, both of which you sign quickly, without asking questions.",
      },
      deny: {
        label: "Deny everything",
        believed: "HR cannot find anything in writing. The matter is closed, and so is the HR office door.",
        scandal: "HR finds the messages. The messages find the board.",
      },
    },
    earningsHit: {
      text: "Quarterly earnings. The board is pleased with this quarter's numbers.",
      bow: {
        label: "Take a bow",
        result: "The board applauds. The stock is up. They love your signature jacket.",
      },
    },
    earningsMiss: {
      text: "Quarterly earnings. You missed the target, and the board has noticed.",
      honest: {
        label: "Give honest guidance",
        result: "Honesty goes over about as well as it usually does with boards.",
      },
      promise: {
        label: "Promise a stronger next quarter",
        result: "The board nods. They have written down your promise, and they will remember it.",
      },
      cook: {
        label: "Cook the numbers",
        slides: "The numbers look beautiful. Nobody checks. It is a very good spreadsheet.",
        caught: "An analyst notices a number that is a little too round. A second analyst notices too.",
      },
    },
    callMild: {
      text: "The board wants a word.",
      callBack: {
        label: "Call them back",
        fine: "They just wanted the keynote slides.",
        bad: "Bad news. They wanted something that you probably don't want them to want.",
      },
      letRing: {
        label: "Let it ring",
        result: "The board notices who does not pick up.",
      },
    },
    callUrgent: {
      text: "The board: call us now. Right now.",
      pr: {
        label: "Hire a crisis PR firm",
        result: "The PR firm turns your problem into a thoughtful statement about \"learning and growth.\"",
      },
      takeCall: {
        label: "Take the call",
        calm: "You stay calm. You say \"transparency\" four times. They seem to like it.",
        blowup: "You stay calm for eleven seconds. The board does not seem to be on the same page.",
      },
    },
    blackwell: {
      text: "The board: where did 100 of our Blackwell GPUs go?",
      paperwork: {
        label: "Show the paperwork",
        result: "The paperwork is clean. It also names a lot of names.",
      },
      rogue: {
        label: "Blame a rogue distributor",
        believed: "A rogue distributor. The board has heard of those.",
        caught: "The distributor has a very organized email folder, and it does not say rogue.",
      },
      scapegoat: {
        label: "Scapegoat the logistics VP",
        result: "The logistics VP leaves with a generous severance and a glare that may keep you up at night for weeks to come.",
      },
    },
    vpGossip: {
      text: "The board is concerned about employees gossiping about you and the VP of healthcare.",
      deny: {
        label: "Deny everything",
        believed: "The board decides the VP of healthcare has better things to do. They hope so.",
        scandal: "Someone has screenshots. Someone always has screenshots.",
      },
      reassign: {
        label: "Reassign the VP",
        result: "The VP of healthcare is now the VP of a division you did not know existed.",
      },
      hush: {
        label: "Pay hush money",
        result: "It buys silence, and a pretty uncomfortable team offsite.",
      },
    },
    megaspeed: {
      text: "A company called Megaspeed seems to have internal NVIDIA info that it shouldn't.",
      investigate: {
        label: "Investigate internally",
        result: "The investigation finds the leak quickly. It then very quietly stops looking.",
      },
      silent: {
        label: "Say nothing",
        result: "You say nothing. The board hears you say nothing.",
      },
      blame: {
        label: "Blame a disgruntled former employee",
        result: "Every company has one. HR hands over a list of former employees, and a much longer list of their grievances.",
      },
    },
    qa: {
      text: "At the shareholder meeting, someone asks about the pallet.",
      honest: {
        label: "Answer honestly",
        result: "You give a clear, boring answer. Shareholders love boring.",
      },
      deflect: {
        label: "Deflect",
        ok: "You pivot to Blackwell Ultra. The room pivots with you.",
        backfire: "You pivot to Blackwell Ultra. A shareholder pivots back to the pallet.",
      },
      joke: {
        label: "Joke about the jacket",
        result: "The room laughs. The leather jacket is the most important asset to the entire company.",
      },
    },
    stockPop: {
      texts: [
        "An analyst upgrades NVIDIA to \"a very strong buy.\" Your stock pops.",
        "A competitor stumbles, and your stock quietly climbs.",
        "A rumor about Blackwell Ultra goes viral. Your stock pops.",
      ],
      sell: {
        label: "Sell some shares",
        result: "You sell a little. The market notices, and does not forgive.",
      },
      hold: {
        label: "Hold your shares",
        result: "You hold. The board appreciates conviction.",
      },
    },
    jacket: {
      texts: [
        "On the way home from work, a leather jacket in the window catches your eye.",
        "On the way to work, a leather jacket in the window catches your eye.",
        "On the way to a hotel in San Jose, a leather jacket in the window catches your eye.",
        "While shopping for leather jackets, you find another leather jacket.",
        "On the way to Haven SF, a leather jacket in the window catches your eye.",
      ],
      buy: {
        label: "Buy it",
        result: "You buy the jacket. It fits like it was meant for you. It was not, but it fits like it was.",
      },
      pass: {
        label: "Keep walking",
        result: "You keep walking. It looks at you from the window the whole way.",
      },
    },
  },
} as const;
