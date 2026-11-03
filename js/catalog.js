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
      "works": "The map and the shield are packed for the river.",
      "backdrop": "river"
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
      "works": "The dragon is in the picture. Quiet is packed with it.",
      "backdrop": "path"
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
      "works": "The lamp is on. Quiet is in the room.",
      "backdrop": "office"
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
  "items": [
    {
      "id": 0,
      "situation": "Pack the pineapple and the lamp before dark. Bring a shield or a castle. Leave the sword aside.",
      "required": [
        "pineapple",
        "lamp"
      ],
      "anyOf": [
        "shield",
        "castle"
      ],
      "forbidden": [
        "sword"
      ],
      "works": "The pineapple and the lamp are packed.",
      "backdrop": "garden",
      "fairness": {
        "name": "Alex",
        "date": "2026-10-22"
      }
    },
    {
      "id": 1,
      "situation": "Keep the oven hot. The fridge stays shut.",
      "required": [
        "oven",
        "hot"
      ],
      "anyOf": [],
      "forbidden": [
        "fridge"
      ],
      "works": "The oven is hot.",
      "fairness": {
        "name": "Alex",
        "date": "2026-10-22"
      }
    },
    {
      "id": 2,
      "situation": "Set the spoon in the fridge, with pizza or a slice. Leave the dragon aside.",
      "required": [
        "fridge",
        "spoon"
      ],
      "anyOf": [
        "pizza",
        "slice"
      ],
      "forbidden": [
        "dragon"
      ],
      "works": "The fridge holds the spoon.",
      "fairness": {
        "name": "Alex",
        "date": "2026-10-22"
      }
    }
  ]
};
export const lines = {
  "notYet": "Not yet.",
  "notToday": "not today",
  "noPuzzle": "No puzzle today.",
  "practice": "Practice. This replay does not count as today's daily.",
  "replay": "Replay",
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
export const samples = {
  "items": [
    {
      "id": 1,
      "sample": true,
      "title": "Tic-Tac-Toe",
      "situation": "Three in a row, corner to corner.",
      "required": [
        "extra",
        "window",
        "sword",
        "circle",
        "quiet"
      ],
      "anyOf": [],
      "forbidden": [],
      "works": "The sample is set.",
      "backdrop": "grid",
      "arrange": {
        "sample": true,
        "checks": [
          "position"
        ],
        "pieces": [
          {
            "id": "extra",
            "placeholder": "X",
            "x": 0.1875,
            "y": 0.2
          },
          {
            "id": "window",
            "placeholder": "X",
            "x": 0.5,
            "y": 0.5
          },
          {
            "id": "sword",
            "placeholder": "X",
            "x": 0.8125,
            "y": 0.8
          },
          {
            "id": "circle",
            "placeholder": "O",
            "x": 0.8125,
            "y": 0.2
          },
          {
            "id": "quiet",
            "placeholder": "O",
            "x": 0.1875,
            "y": 0.8
          }
        ]
      }
    },
    {
      "id": 2,
      "sample": true,
      "title": "Leaning Tower",
      "situation": "Stack three blocks, biggest on the bottom, the top one tipping over.",
      "required": [
        "square",
        "fridge",
        "oven"
      ],
      "anyOf": [],
      "forbidden": [],
      "works": "The sample is set.",
      "backdrop": "room",
      "arrange": {
        "sample": true,
        "checks": [
          "position",
          "size",
          "turn",
          "layer"
        ],
        "pieces": [
          {
            "id": "square",
            "placeholder": "block A",
            "x": 0.5,
            "y": 0.8,
            "size": 1.5,
            "turn": 0,
            "z": 0,
            "symmetry": 90
          },
          {
            "id": "fridge",
            "placeholder": "block B",
            "x": 0.5,
            "y": 0.6,
            "size": 1,
            "turn": 0,
            "z": 1
          },
          {
            "id": "oven",
            "placeholder": "block C",
            "x": 0.55,
            "y": 0.45,
            "size": 0.6,
            "turn": 20,
            "z": 2
          }
        ]
      }
    },
    {
      "id": 3,
      "sample": true,
      "title": "Picnic",
      "situation": "A picnic under a tree: blanket on the grass, basket on the blanket, sun in the corner.",
      "required": [
        "lamp",
        "map",
        "mug",
        "pineapple",
        "star",
        "dragon"
      ],
      "anyOf": [],
      "forbidden": [],
      "works": "The sample is set.",
      "backdrop": "garden",
      "arrange": {
        "sample": true,
        "checks": [
          "position",
          "size",
          "turn",
          "layer"
        ],
        "pieces": [
          {
            "id": "lamp",
            "placeholder": "tree",
            "x": 0.2,
            "y": 0.45,
            "size": 1.8,
            "turn": 0,
            "z": 0
          },
          {
            "id": "map",
            "placeholder": "blanket",
            "x": 0.6,
            "y": 0.75,
            "size": 1.4,
            "turn": -10,
            "z": 1
          },
          {
            "id": "mug",
            "placeholder": "basket",
            "x": 0.6,
            "y": 0.7,
            "size": 0.7,
            "turn": 0,
            "z": 2
          },
          {
            "id": "pineapple",
            "placeholder": "apple",
            "x": 0.7,
            "y": 0.72,
            "size": 0.4,
            "turn": 0,
            "z": 2
          },
          {
            "id": "star",
            "placeholder": "sun",
            "x": 0.85,
            "y": 0.15,
            "size": 1,
            "turn": 0,
            "z": 0
          },
          {
            "id": "dragon",
            "placeholder": "bird",
            "x": 0.45,
            "y": 0.25,
            "size": 0.5,
            "turn": 15,
            "z": 1
          }
        ]
      }
    }
  ]
};
