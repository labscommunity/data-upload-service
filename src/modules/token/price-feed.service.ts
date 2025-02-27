import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenTicker } from '@prisma/client';
import axios from 'axios';
import { BigNumber } from 'bignumber.js';
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
        const priceInAR = priceInWinston / 1000000000000; // TODO: move to constants

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

    async convertToTokenAmount(amountInUSD: number, tokenTicker: TokenTicker, decimals: number) {
        try {
            const tokenPriceResponse = await this.client.tools.priceConversion({
                amount: amountInUSD,
                symbol: 'USD',
                convert: tokenTicker,
            });

            const amount = tokenPriceResponse.data.quote[tokenTicker].price;
            const amountInSubUnits = await this.convertToSubUnits(amount, decimals);
            const amountInScaledUnits = await this.convertToScaledUnits(amountInSubUnits, decimals);

            if (!(BigNumber(amount).isEqualTo(BigNumber(amountInScaledUnits)))) {
                return { amount: amountInScaledUnits, amountInSubUnits };
            }

            return { amount, amountInSubUnits };
        } catch (error) {
            this.logger.error('Failed to get token price', error);
            throw new ServiceUnavailableException('Failed to get token price');
        }
    }

    async convertToSubUnits(amount: number, decimals: number) {
        return new BigNumber(amount).multipliedBy(new BigNumber(10).pow(decimals)).integerValue(BigNumber.ROUND_UP).toFixed();
    }

    async convertToScaledUnits(amount: string, decimals: number) {
        return new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals)).toFixed();
    }
}