```mermaid
erDiagram
    GAME {}
    PLATFORM {}
    GAME_PLATFORM {}
    GENRE {}
    GAME_GENRE {}
    THEME {}
    GAME_THEME {}
    GAMEMODE {}
    GAME_GAMEMODE {}
    COMPANY {}
    INVOLVED_COMPANY {}
    ARTWORK {}
    SCREENSHOT {}
    COVER {}

    GAME ||--o{ GAME_PLATFORM     : "available on"
    GAME_PLATFORM }o--|| PLATFORM  : on
    GAME ||--o{ GAME_GENRE        : categorized_as
    GAME_GENRE }o--|| GENRE       : of
    GAME ||--o{ GAME_THEME        : has_theme
    GAME_THEME }o--|| THEME       : of
    GAME ||--o{ GAME_GAMEMODE     : supports
    GAME_GAMEMODE }o--|| GAMEMODE  : mode
    GAME ||--o{ INVOLVED_COMPANY  : has
    INVOLVED_COMPANY }o--|| COMPANY : "is company"
    GAME ||--o{ ARTWORK           : has
    GAME ||--o{ SCREENSHOT        : has
    GAME ||--o| COVER             : has
```