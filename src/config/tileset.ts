import { TilesetDefinition } from '../types/tiles';

export const tilesetConfig: TilesetDefinition = {
    tileSize: 32,
    tiles: {
        GRASS_1: {
            name: 'Grass Type 1',
            coordinate: { x: 1, y: 1 },  // ID: 9 (1,1 in 8-column layout)
            walkable: true,
            description: 'Basic grass tile variant 1'
        },
        GRASS_2: {
            name: 'Grass Type 2',
            coordinate: { x: 2, y: 1 },  // ID: 10 (2,1 in 8-column layout)
            walkable: true,
            description: 'Basic grass tile variant 2'
        },
        GRASS_3: {
            name: 'Grass Type 3',
            coordinate: { x: 2, y: 3 },  // ID: 26 (2,3 in 8-column layout)
            walkable: true,
            description: 'Basic grass tile variant 3'
        },
        BOULDER_1: {
            name: 'Boulder Type 1',
            coordinate: { x: 0, y: 3 },  // ID: 24 (0,3 in 8-column layout)
            walkable: false,
            description: 'Impassable boulder'
        },
        BOULDER_2: {
            name: 'Boulder Type 2',
            coordinate: { x: 1, y: 3 },  // ID: 25 (1,3 in 8-column layout)
            walkable: false,
            description: 'Impassable boulder variant'
        },
        // Pokemon Center tiles (top-left corner as reference)
        POKEMON_CENTER_TL: {
            name: 'Pokemon Center Top Left',
            coordinate: { x: 0, y: 13 },  // ID: 104
            walkable: false,
            description: 'Pokemon Center building - Top Left'
        },
        POKEMON_CENTER_TM: {
            name: 'Pokemon Center Top Middle',
            coordinate: { x: 1, y: 13 },  // ID: 105
            walkable: false,
            description: 'Pokemon Center building - Top Middle'
        },
        POKEMON_CENTER_TR: {
            name: 'Pokemon Center Top Right',
            coordinate: { x: 2, y: 13 },  // ID: 106
            walkable: false,
            description: 'Pokemon Center building - Top Right'
        }
    }
}; 