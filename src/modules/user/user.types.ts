import { User } from '@prisma/client';

export type CreateUserInput = Omit<
    User,
    'id' | 'createdAt' | 'updatedAt' | 'role'
>;

export type ArKeys = {
    jwk: any;
    address: string;
    publicKey: string;
}
