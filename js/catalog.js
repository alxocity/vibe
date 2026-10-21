// Generated from web/data by scripts/build-static.mjs. Do not edit.
export const tray = {
  "groups": [
    {
      "id": "kitchen",
      "label": "Kitchen",
      "blocks": [
        {
          "id": "pineapple",
          "label": "pineapple"
        },
        {
          "id": "pizza",
          "label": "pizza"
        },
        {
          "id": "oven",
          "label": "oven"
        },
        {
          "id": "fridge",
          "label": "fridge"
        },
        {
          "id": "spoon",
          "label": "spoon"
        },
        {
          "id": "red",
          "label": "red"
        },
        {
          "id": "circle",
          "label": "circle"
        },
        {
          "id": "extra",
          "label": "extra"
        },
        {
          "id": "hot",
          "label": "hot"
        },
        {
          "id": "slice",
          "label": "slice"
        }
      ]
    },
    {
      "id": "office",
      "label": "Office",
      "blocks": [
        {
          "id": "lamp",
          "label": "lamp"
        },
        {
          "id": "desk",
          "label": "desk"
        },
        {
          "id": "chair",
          "label": "chair"
        },
        {
          "id": "mug",
          "label": "mug"
        },
        {
          "id": "window",
          "label": "window"
        },
        {
          "id": "sticky-note",
          "label": "sticky note"
        },
        {
          "id": "blue",
          "label": "blue"
        },
        {
          "id": "square",
          "label": "square"
        },
        {
          "id": "busy",
          "label": "busy"
        },
        {
          "id": "quiet",
          "label": "quiet"
        }
      ]
    },
    {
      "id": "fantasy",
      "label": "Fantasy",
      "blocks": [
        {
          "id": "dragon",
          "label": "dragon"
        },
        {
          "id": "crown",
          "label": "crown"
        },
        {
          "id": "sword",
          "label": "sword"
        },
        {
          "id": "castle",
          "label": "castle"
        },
        {
          "id": "potion",
          "label": "potion"
        },
        {
          "id": "shield",
          "label": "shield"
        },
        {
          "id": "map",
          "label": "map"
        },
        {
          "id": "purple",
          "label": "purple"
        },
        {
          "id": "star",
          "label": "star"
        },
        {
          "id": "quest",
          "label": "quest"
        }
      ]
    }
  ]
};
export const solo = {
  "items": [
    {
      "id": 1,
      "title": "Cross the river",
      "situation": "The path stops at a river. Pack the map and the shield. Leave the sword on the bank.",
      "required": [
        "map",
        "shield"
      ],
      "anyOf": [],
      "forbidden": [
        "sword"
      ],
      "works": "The map and the shield are packed for the river."
    },
    {
      "id": 2,
      "title": "The dragon on the path",
      "situation": "The picture includes the dragon and quiet, plus one of potion, map, or shield. The sword is not in the picture.",
      "required": [
        "dragon",
        "quiet"
      ],
      "anyOf": [
        "potion",
        "map",
        "shield"
      ],
      "forbidden": [
        "sword"
      ],
      "works": "The dragon is in the picture. Quiet is packed with it."
    },
    {
      "id": 3,
      "title": "Bake the extra pizza",
      "situation": "Bake pizza in the oven, and pack extra. The fridge stays shut.",
      "required": [
        "pizza",
        "oven",
        "extra"
      ],
      "anyOf": [],
      "forbidden": [
        "fridge"
      ],
      "works": "The pizza goes in the oven, with extra."
    },
    {
      "id": 4,
      "title": "Keep the oven hot",
      "situation": "Keep it hot in the oven. The fridge stays shut.",
      "required": [
        "oven",
        "hot"
      ],
      "anyOf": [],
      "forbidden": [
        "fridge"
      ],
      "works": "The oven is hot."
    },
    {
      "id": 5,
      "title": "Light the quiet office",
      "situation": "The room needs the lamp and quiet.",
      "required": [
        "lamp",
        "quiet"
      ],
      "anyOf": [],
      "forbidden": [],
      "works": "The lamp is on. Quiet is in the room."
    },
    {
      "id": 6,
      "title": "Stock the fridge",
      "situation": "Stock the fridge with pizza, a slice, or a spoon. Leave the dragon and the sword out.",
      "required": [
        "fridge"
      ],
      "anyOf": [
        "pizza",
        "slice",
        "spoon"
      ],
      "forbidden": [
        "dragon",
        "sword"
      ],
      "works": "The fridge is stocked."
    },
    {
      "id": 7,
      "title": "The quest past the star",
      "situation": "The quest goes past the star. Pack the quest, the map, the star, and the castle.",
      "required": [
        "quest",
        "map",
        "star",
        "castle"
      ],
      "anyOf": [],
      "forbidden": [],
      "works": "The quest follows the map past the star to the castle."
    },
    {
      "id": 8,
      "title": "The crown in the castle",
      "situation": "The crown is in the castle. Pack the crown and the castle, and either the star or purple. The sword stays out.",
      "required": [
        "crown",
        "castle"
      ],
      "anyOf": [
        "star",
        "purple"
      ],
      "forbidden": [
        "sword"
      ],
      "works": "The crown is in the castle."
    },
    {
      "id": 9,
      "title": "Stir the potion",
      "situation": "Stir the potion with the spoon. The sword stays out.",
      "required": [
        "potion",
        "spoon"
      ],
      "anyOf": [],
      "forbidden": [
        "sword"
      ],
      "works": "The spoon stirs the potion."
    },
    {
      "id": 10,
      "title": "Busy and quiet at the window",
      "situation": "The window is both busy and quiet.",
      "required": [
        "window",
        "busy",
        "quiet"
      ],
      "anyOf": [],
      "forbidden": [],
      "works": "The window is busy and quiet."
    }
  ]
};
export const echoes = {
  "withdrawn": [],
  "items": []
};
export const lines = {
  "players": "Players are 18+.",
  "game": "This is a game, not therapy, not legal advice.",
  "real": "Something real is not for this game. Alex arranges that separately and privately, when it fits the rules.",
  "realDaily": "Something real is not for this game.",
  "soloAside": "A game with other people is not this page.",
  "notYet": "Not yet.",
  "notToday": "not today",
  "noPuzzle": "No puzzle today.",
  "storageWarning": "progress won't be saved.",
  "clear": "End and clear all progress",
  "sharePrefix": "Echo ",
  "shareSuffix": ": solved",
  "oneSeat": "One seat passed.",
  "tie": "It is a tie.",
  "neither": "Neither seat passed.",
  "closed": "The match is over, and it says nothing about anyone.",
  "playbackNote": "Playback only. No score."
};
export const calendar = {
  "launch": {
    "y": 2026,
    "m": 10,
    "d": 21
  }
};
export const playback = {
  "note": "Playback only. No score.",
  "frames": [
    "A hot extra circle of pizza and pineapple.",
    "pizza, oven, red, slice, square"
  ]
};
