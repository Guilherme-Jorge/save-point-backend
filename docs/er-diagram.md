```mermaid
erDiagram
    %% User of SavePoint
    USER {
        string id PK
        sting username
        string email
        string password
        string forgot_pass_token
        date forgot_pass_expires
        date created_at
        date updated_at
    }

    %% User's game library
    OWNERSHIP {
        string user_id FK
        string game_id FK
    }

    %% Main game entry
    GAME {
        string id PK
        int igdb_id
        string name
        string summary
        date release_date
    }

    %% Game and Genre relationship
    GAME_GENRE {
        string game_id PK
        string genre_id PK
    }

    %% Genre classification
    GENRE {
        string id PK
        int igdb_id
        string name
    }

    %% Game and Theme relationship
    GAME_THEME {
        string game_id PK
        string theme_id PK
    }

    %% Themes, as in Horror, Sci-Fi etc.
    THEME {
        string id PK
        int igdb_id
        string name
    }

    %% Game and Game Mode relationship
    GAME_GAMEMODE {
        string game_id PK
        string gamemode_id PK
    }

    %% Game modes, including Single-player, Multiplayer etc.
    GAMEMODE {
        string id PK
        int igdb_id
        string name
    }

    %% Game and Platform relationship
    GAME_PLATFORM {
        string game_id FK
        string platform_id FK
    }

    %% Platform where games are available
    PLATFORM {
        string id PK
        int igdb_id
        string name
    }

    %% Links games with companies and their roles
    INVOLVED_COMPANY {
        string id PK
        int igdb_id
        boolean developer
        boolean publisher
        string game_id FK
        string company_id FK
    }

    %% Developers, publishers etc.
    COMPANY {
        int id PK
        string name
    }

    %% Artwork, including artworks, featured images etc.
    ARTWORK {
        string id PK
        string game_id FK
        int igdb_artwork_id
        string igdb_artwork_url
    }

    %% Screenshots from the game
    SCREENSHOT {
        string id PK
        int igdb_id
        string url
        string game_id FK
    }

    %% USER and USER relationship for follow system
    FOLLOWS {
        string follower_id FK
        string followed_id FK
        date created_at
    }

    %% USER and USER relationship for direct messaging system
    "DIRECT MESSAGE" {
        string sender_id FK
        string reciever_id FK
        date created_at
        date updated_at
        string message
    }

    %% USER <-> GAME via OWNERSHIP
    USER ||--o{ OWNERSHIP : owns
    GAME ||--o{ OWNERSHIP : "is owned by"

    %% GAME <-> PLATFORM via GAME_PLATFORM
    GAME ||--o{ GAME_PLATFORM : "associated with"
    GAME_PLATFORM }o--|| PLATFORM : on

    %% GAME <-> GENRE via GAME_GENRE
    GAME ||--o{ GAME_GENRE : "categorized as"
    GAME_GENRE }o--|| GENRE : of

    %% GAME <-> THEME via GAME_THEME
    GAME ||--o{ GAME_THEME : "has theme"
    GAME_THEME }o--|| THEME : is

    %% GAME <-> GAMEMODE via GAME_GAMEMODE
    GAME ||--o{ GAME_GAMEMODE : supports
    GAME_GAMEMODE }o--|| GAMEMODE : mode

    %% GAME <-> COMPANY via INVOLVED_COMPANY
    GAME ||--o{ INVOLVED_COMPANY : has
    INVOLVED_COMPANY }o--|| COMPANY : represents

    %% GAME <-> ARTWORK
    GAME ||--o{ ARTWORK : has

    %% GAME <-> SCREENSHOT
    GAME ||--o{ SCREENSHOT : "has"

    %% FOLLOWS/FOLLOWED from USER
    FOLLOWS }o--|| USER : follows
    FOLLOWS }o--|| USER : "is followed by"

    %% DIRECT MESSAGES from USER
    USER ||--o{ "DIRECT MESSAGE" : sends
    USER ||--o{ "DIRECT MESSAGE" : receives
```
