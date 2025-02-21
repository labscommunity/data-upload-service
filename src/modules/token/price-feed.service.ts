import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenTicker } from '@prisma/client';
import axios from 'axios';
import { RestClient, restClient } from "coinmarketcap-js";
import { LoggerService } from 'src/core/logger/logger.service';

@Injectable()
export class PriceFeedService {
    private readonly client: RestClient;
    constructor(
        private readonly logger: LoggerService,
        private readonly configService: ConfigService,
    ) {
        this.client = restClient(this.configService.getOrThrow(`priceFeed.apiKeyProd`), undefined, this.configService.getOrThrow(`priceFeed.baseUrlProd`));
    }

    async getUploadCostEstimateInWinston(size: number): Promise<number> {
        try {
            const response = await axios.get(`https://arweave.net/price/${size}`);

            return parseInt(response.data);
        } catch (error) {
            this.logger.error('Failed to get upload cost estimate in AR', error);
            throw new ServiceUnavailableException('Failed to get upload cost estimate in AR');
        }
    }

    async getUploadCostEstimateInUSD(size: number): Promise<number> {

        const priceInWinston = await this.getUploadCostEstimateInWinston(size);
        const priceInAR = priceInWinston / 1000000000000;

        try {
            const price = await this.client.tools.priceConversion({
                amount: priceInAR,
                symbol: 'AR',
            });
            console.log(price.data);

            return price.data.quote.USD.price;
        } catch (error) {
            this.logger.error('Failed to get upload cost estimate in USD', error);
            throw new ServiceUnavailableException('Failed to get upload cost estimate in USD');
        }
    }

    async convertToTokenAmount(amountInUSD: number, tokenTicker: TokenTicker) {
        try {
            const tokenPriceResponse = await this.client.tools.priceConversion({
                amount: amountInUSD,
                symbol: 'USD',
                convert: tokenTicker,
            });

            return tokenPriceResponse.data.quote[tokenTicker].price;
        } catch (error) {
            this.logger.error('Failed to get token price', error);
            throw new ServiceUnavailableException('Failed to get token price');
        }
    }
}