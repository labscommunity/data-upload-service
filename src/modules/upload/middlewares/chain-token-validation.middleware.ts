import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ChainTokenValidationMiddleware implements NestMiddleware {
    constructor(
        private readonly dataService: DatabaseService,
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {
        if (req.method === 'POST' && req.body) {
            const { chainType, tokenTicker, chainId, network } = req.body;

            if (!chainType || !tokenTicker || !chainId || !network) {
                throw new BadRequestException('Chain type and token ticker are required');
            }

            const validToken = await this.dataService.token.findFirst({
                where: {
                    ticker: tokenTicker,
                    chainType: chainType,
                    chainId: chainId,
                    network: network,
                },
            });

            if (!validToken) {
                throw new BadRequestException(
                    `Invalid combination of chain type "${chainType}" and token "${tokenTicker}"`,
                );
            }
        }
        next();
    }
}