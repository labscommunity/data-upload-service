import { ChainType, Role } from "@prisma/client";

export interface User {
    id: number;
    walletAddress: string;
    chainType: ChainType;
    role: Role;
}
