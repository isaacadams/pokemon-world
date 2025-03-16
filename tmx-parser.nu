# Script: generate_map_api.nu

# Function to parse tileset and extract tile information
def parse-tileset [tileset_path: string] {
  let tileset_xml = (open $tileset_path | from xml)
  
  # Extract tile dimensions from root
  print $tileset_xml.attributes

  let tile_width = ($tileset_xml.attributes.tilewidth | into int)
  let tile_height = ($tileset_xml.attributes.tileheight | into int)
  
  # Process tiles
  let tiles = if "tile" in $tileset_xml.content {
    let tile_list = if ($tileset_xml.contents.tile | describe) == "record" {
      [$tileset_xml.contents.tile]
    } else {
      $tileset_xml.contents.tile
    }
    
    $tile_list | each { |tile|
      let id = ($tile.attributes.id | into int) + 1  # GIDs are 1-based
      let props = if "properties" in $tile.contents {
        $tile.contents.properties.property | reduce -f {} { |it, acc|
          $acc | upsert $it.attributes.name $it.attributes.value
        }
      } else {
        {}
      }
      
      {
        id: $id
        x: 0
        y: 0
        width: $tile_width
        height: $tile_height
        properties: $props
      }
    }
  } else {
    []
  }
  
  $tiles | reduce -f {} { |tile, acc| $acc | upsert $tile.id $tile }
}

# Function to parse map and extract sprite instances
def parse-map [map_path: string, tile_cache: record] {
  let map_xml = (open $map_path | from xml)
  
  let map_width = ($map_xml.attributes.width | into int)
  let map_height = ($map_xml.attributes.height | into int)
  let tile_width = ($map_xml.attributes.tilewidth | into int)
  let tile_height = ($map_xml.attributes.tileheight | into int)

  $map_xml | save -f map.json
  let sprites = $map_xml.content | where tag == "layer" | each { |layer|
    let tile_data = parse-layer $layer
    print $tile_data

    let tile_data = ($layer.content.data.content
      | split row "\n" 
      | where $it != "" 
      | each { |row| $row | split row "," | into int })
    
    $tile_data | enumerate | flat-map { |row|
      $row.item | enumerate | where $it.item > 0 | each { |tile|
        {
          gid: $tile.item
          x: $tile.index * $tile_width
          y: $row.index * $tile_height
          layer: $layer.attributes.name
          tileInfo: $tile_cache | get -i $tile.item
        }
      }
    }
  } | flatten
  
  {
    tiles: $tile_cache
    sprites: $sprites
    width: ($map_width * $tile_width)
    height: ($map_height * $tile_height)
  }
}

def parse-layer [layer] {
    print --raw $layer.attributes
    #let content = $layer.content | where tag == "data"
    #$content | parse-layer ($in | into record)

    $layer.content 
        | where tag == "data" 
        | each { $in | into record }
        | each { |row|
            match $row.attributes.encoding {
                "csv" => {
                    $row.content 
                        | each { |r| $r.content | split row "\n" } 
                        | flatten 
                        | where $it != "" 
                        | each { |r| $r.item | split row "," | where $it != "" | into int }
                }
                _ => {
                    print $layer.attributes.encoding
                    print "encoding not supported"
                    exit 1
                }
            }
        }
        | inspect
        | enumerate
        | each { |r| 
            $r | enumerate 
                | each { |c|
                    {
                        id: $c.item
                        row: $r.index
                        column: $c.index
                    }
                } 
        }    
        | flatten
        | inspect
}

# Main function to generate the API
def main [] {
  let tileset_path = "src/assets/tilesets/overworld.tmx"
  let map_path = "src/assets/tilesets/map1.tmx"
  let output_path = "src/generatedMapAPI.ts"
  
  # Parse tileset first
  let tile_cache = (parse-tileset $tileset_path)
  
  # Parse map and generate full analysis
  let map_data = (parse-map $map_path $tile_cache)
  
  # Generate TypeScript content
  let ts_content = $"
// Generated Map API
export interface TileInfo {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, string | number | boolean>;
}

export interface SpriteInfo {
  gid: number;
  x: number;
  y: number;
  layer: string;
  tileInfo?: TileInfo;
}

export const MapData = {
  tiles: ($map_data.tiles | to json -r) as Record<number, TileInfo>,
  sprites: ($map_data.sprites | to json -r) as SpriteInfo[],
  width: $map_data.width,
  height: $map_data.height
};
"
  
  # Write to file
  $ts_content | save -f $output_path
  print $"Map API generated at ($output_path)"
}

# Run the script
main