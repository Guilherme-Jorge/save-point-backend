interface UserReturnInterface {
    id?: number,
    email: string,
    name: string
}

export class UserReturn {

    constructor(user: UserReturnInterface) {
        this.id = user.id;
        this.email = user.email;
        this.name = user.name;
    }

    id?: number; 

    email: string;

    name: string;
}