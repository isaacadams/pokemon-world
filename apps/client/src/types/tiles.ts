export interface TileCoordinate {
   x: number; // X coordinate in the tileset (in terms of tile position, not pixels)
   y: number; // Y coordinate in the tileset (in terms of tile position, not pixels)
}

export interface TileDefinition {
   name: string;
   coordinate: TileCoordinate;
   walkable: boolean;
   description?: string;
}

export interface TilesetDefinition {
   tileSize: number;
   tiles: { [key: string]: TileDefinition };
}
