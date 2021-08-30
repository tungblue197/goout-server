export type User = {
    id?: string,
    username?: string;
    password?: string;
    tId?: string;
    name?: string;
    photoURL?: string;
    location?: Location,
    locationName?: string,
    type?: 'normal' | 'google',
    locationId?: string 
}

export type Room = {
    id?:string,
    users?: User[],
    votes?: Vote[]
}

export type Vote = {
    lId?: string,
    user:User
}
