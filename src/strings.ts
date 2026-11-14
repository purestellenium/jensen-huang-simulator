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
    secret: "Secret Mode",
    logo: {
      nvidia: "NVIDIA",
      hackclub: "Hack Club",
    },
  },

  hud: {
    turn: "TURN",
    summaryTurn: (turn: number) => `Turn ${turn}.`,
    stats: {
      money: "Money",
      affairs: "Affairs",
      feds: "Feds",
      wife: "Wife",
      board: "Board",
    },
  },

  amounts: {
    money: (value: number) => `$${trimmed(value)}M`,
    affairs: (count: number) => `${trimmed(count)} AFFAIR${count === 1 ? "" : "S"}`,
    gain: (text: string) => `+${text}`,
    loss: (text: string) => `-${text}`,
  },

  apps: {
    dating: "Dating",
    wechat: "WeChat",
    signal: "Signal",
  },

  endings: {
    feds: {
      headline: "NVIDIA CEO ARRESTED IN LEATHER JACKET",
      story: "Federal agents say the paper trail was \"longer than a GPU backorder.\"",
    },
    wife: {
      headline: "NVIDIA CEO'S WIFE FINDS OUT",
      story: "Sources confirm the divorce lawyer is already using his own GPUs to run the numbers.",
    },
    board: {
      headline: "NVIDIA BOARD FIRES CEO",
      story: "\"We just stopped believing the more you buy, the more you save,\" said one director.",
    },
    bounceBack: "How will Jensen Huang bounce back from this?",
  },

  scenarios: {
    datingSpy: {
      text: "NotAChineseSpy wants to match!",
      decline: {
        label: "ugly bitch",
        result: "Swiped left. Somewhere, a very patient intelligence agency sighs.",
      },
      accept: {
        label: "Yes my sexy spy",
        result: "It's a match. Her bio just says \"love long walks near data centers.\"",
      },
    },
    datingKyle: {
      text: "Kyle, 34, wants to match! His bio: \"Looking for someone who understands CUDA.\"",
      left: {
        label: "Swipe left",
        result: "Kyle will survive.",
      },
      right: {
        label: "Swipe right",
        result: "Kyle explains CUDA for ninety minutes. You already knew all of it.",
      },
    },
    datingBarista: {
      text: "Barista, 0.4 miles away, wants to match! She drew a tiny GPU in your foam last Tuesday.",
      left: {
        label: "Swipe left",
        result: "She frames the receipt anyway.",
      },
      right: {
        label: "Swipe right",
        result: "A match. This will be a problem later.",
      },
    },
    datingBaristaAgain: {
      text: "Barista sent three photos of lattes and one photo of a friend. The friend is also a barista.",
      replyAll: {
        label: "Reply to all",
        result: "Two affairs in one turn. The board does not have a metric for this.",
      },
      justLattes: {
        label: "Just the lattes",
        result: "A coffee is deniable. You tell yourself that.",
      },
      block: {
        label: "Block",
        result: "Blocked. Security footage of you blocking her is, unfortunately, also a thing.",
      },
    },
    datingLori: {
      text: "Lori_Official wants to match! Her bio: \"Married to a guy who's always 'in a meeting.'\"",
      unmatch: {
        label: "Unmatch, fast",
        result: "The app tells her you unmatched. Everyone saw.",
      },
      matchWife: {
        label: "Match with your own wife",
        result: "Date night. It costs a lot more than a latte.",
      },
    },
    wechatLing: {
      text: "Ling Long wants 100 NVIDIA Blackwell GPUs",
      refuse: {
        label: "-1000 social credit",
        result: "Ling Long is disappointed. Somewhere, a spreadsheet updates.",
      },
      accept: {
        label: "fuck export restrictions",
        result: "One hundred GPUs, one pallet, zero questions. For now.",
      },
    },
    wechatWei: {
      text: "Wei wants 10,000 H20s. He says they're for gaming.",
      refuse: {
        label: "Refuse",
        result: "Wei sends a thumbs up. Then a second, slower thumbs up.",
      },
      ship: {
        label: "Ship them",
        result: "That is a lot of gaming.",
      },
    },
    wechatEnvelope: {
      text: "Ling Long sent you a red envelope. It's very thick.",
      giveBack: {
        label: "Return it",
        result: "Returned. He sends it back. You return it again. This goes on for a while.",
      },
      accept: {
        label: "Accept",
        result: "It was a lot of money, and you did not ask what for.",
      },
    },
    wechatSecondPallet: {
      text: "Ling Long: where is the second pallet?",
      outOfStock: {
        label: "Out of stock",
        result: "He does not believe you. He is correct not to.",
      },
      ship: {
        label: "Ship it, it's fine",
        result: "A second pallet. The first one is still unexplained.",
      },
    },
    signalFbi: {
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
    },
    signalBoard: {
      text: "Board group chat: \"Jensen, call us. Now.\"",
      callBack: {
        label: "Call them back",
        fine: "They just wanted the keynote slides.",
        bad: "They wanted something else entirely.",
      },
      mute: {
        label: "Mute notifications",
        result: "Peace and quiet. The board notices the peace and quiet.",
      },
    },
    signalLori: {
      text: "Lori: why did the dating app send a notification to the family iPad?",
      supplier: {
        label: "It's a supplier",
        believed: "She wants to believe you. She does, for now.",
        calls: "She calls the number. A supplier of what, exactly?",
      },
      gift: {
        label: "Buy her a very rare GPU",
        result: "She does not game. The gift is accepted regardless.",
      },
      heart: {
        label: "Send a heart emoji",
        result: "It buys you an evening.",
      },
    },
    signalLawyer: {
      text: "Your lawyer: we need to talk. $900 an hour.",
      hire: {
        label: "Hire the whole firm",
        result: "The lawyers cost a fortune and fix most of it.",
      },
      disappearing: {
        label: "Turn on disappearing messages",
        result: "The messages disappear. The fact that they disappeared does not.",
      },
    },
    signalDisappeared: {
      text: "John FBI: disappearing messages are also a message.",
      blame: {
        label: "Blame the intern",
        result: "The intern is escorted out. This is bad for morale and worse for the lawsuit.",
      },
      gift: {
        label: "Offer a signed GPU",
        accepted: "He accepts. He is a gamer, after all.",
        bribe: "He logs it as a bribe. Of course he does.",
      },
    },
  },
} as const;
