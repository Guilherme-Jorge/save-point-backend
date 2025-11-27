interface UserReturnInterface {
  id?: string;
  email: string;
  username: string;
  profilePictureUrl?: string;
}

export class UserReturn {
  constructor(user: UserReturnInterface) {
    this.id = user.id;
    this.email = user.email;
    this.username = user.username;
    this.profilePictureUrl = user.profilePictureUrl;
  }

  id?: string;

  email: string;

  username: string;

  profilePictureUrl?: string;
}
