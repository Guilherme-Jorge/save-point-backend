interface UserReturnInterface {
    id?: number,
    email: string,
    username: string
}

export class UserReturn {

    constructor(user: UserReturnInterface) {
        this.id = user.id;
        this.email = user.email;
        this.username = user.username;
    }

    id?: number; 

    email: string;

    username: string;
}