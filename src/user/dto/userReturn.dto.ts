interface UserReturnInterface {
    id?: string,
    email: string,
    username: string
}

export class UserReturn {

    constructor(user: UserReturnInterface) {
        this.id = user.id;
        this.email = user.email;
        this.username = user.username;
    }

    id?: string; 

    email: string;

    username: string;
}