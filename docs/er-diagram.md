```mermaid
erDiagram
    USER {
        string id PK
        sting username
        string email
        string password
        string forgotPassToken
        timestamp forgotPassExpires
        timestamp created_at
        timestamp updated_at
    }

    GAME {
        string id PK
        string name
        integer igdb_id
    }

    COVER {
        string id PK
        integer game_id FK
        integer igdb_cover_id
    }

    OWNERSHIP {
        string user_id FK
        string game_id FK
    }

    FOLLOWS{
        string follower_id FK
        string followed_id FK
        timestamp created_at
    }

    "DIRECT MESSAGE" {
        string sender_id FK
        string reciever_id FK
        timestamp created_at
        timestamp updated_at
        string message
    }

    USER ||..o{ OWNERSHIP : owns
    GAME ||--o{ OWNERSHIP : "is owned by"

    GAME ||--o| COVER : has

    FOLLOWS }o--o| USER : follows
    FOLLOWS }o--o| USER : "is followed by"

    USER |o--o{ "DIRECT MESSAGE" : sends
    USER |o--o{ "DIRECT MESSAGE" : receives
```
