import { TilesetDefinition } from '../types/tiles';

export const tilesetConfig: TilesetDefinition = {
    tileSize: 32,
    tiles: {
        GRASS_1: {
            name: 'Grass Type 1',
            coordinate: { x: 9 % 8, y: Math.floor(9 / 8) },  // ID: 9 -> (1, 1)
            walkable: true,
            description: 'Basic grass tile variant 1'
        },
        GRASS_2: {
            name: 'Grass Type 2',
            coordinate: { x: 10 % 8, y: Math.floor(10 / 8) },  // ID: 10 -> (2, 1)
            walkable: true,
            description: 'Basic grass tile variant 2'
        },
        GRASS_3: {
            name: 'Grass Type 3',
            coordinate: { x: 26 % 8, y: Math.floor(26 / 8) },  // ID: 26 -> (2, 3)
            walkable: true,
            description: 'Basic grass tile variant 3'
        },
        BOULDER_1: {
            name: 'Boulder Type 1',
            coordinate: { x: 24 % 8, y: Math.floor(24 / 8) },  // ID: 24 -> (0, 3)
            walkable: false,
            description: 'Impassable boulder'
        },
        BOULDER_2: {
            name: 'Boulder Type 2',
            coordinate: { x: 25 % 8, y: Math.floor(25 / 8) },  // ID: 25 -> (1, 3)
            walkable: false,
            description: 'Impassable boulder variant'
        },
        // Pokemon Center tiles (top-left corner as reference)
        POKEMON_CENTER_TL: {
            name: 'Pokemon Center Top Left',
            coordinate: { x: 104 % 8, y: Math.floor(104 / 8) },  // ID: 104 -> (0, 13)
            walkable: false,
            description: 'Pokemon Center building - Top Left'
        },
        POKEMON_CENTER_TM: {
            name: 'Pokemon Center Top Middle',
            coordinate: { x: 105 % 8, y: Math.floor(105 / 8) },  // ID: 105 -> (1, 13)
            walkable: false,
            description: 'Pokemon Center building - Top Middle'
        },
        POKEMON_CENTER_TR: {
            name: 'Pokemon Center Top Right',
            coordinate: { x: 106 % 8, y: Math.floor(106 / 8) },  // ID: 106 -> (2, 13)
            walkable: false,
            description: 'Pokemon Center building - Top Right'
        }
    }
}; 