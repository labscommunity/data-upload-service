import { Token } from '@prisma/client';

export type CreateTokenInput = Omit<
    Token,
    'id' | 'createdAt' | 'updatedAt'
>;
