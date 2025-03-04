import { BadRequestException } from "@nestjs/common";
import { ArweaveSigner, Bundle, bundleAndSignData, DataItem, JWKInterface } from "arbundles";
import Arweave from "arweave/node";
import { Tag } from "arweave/node/lib/transaction";

export class ArweaveUploader {
    private readonly arweaveClient: Arweave;
    private readonly signer: ArweaveSigner;

    constructor(private readonly jwk: JWKInterface) {
        this.arweaveClient = Arweave.init({
            host: 'arweave.net',
            port: 443,
            protocol: 'https',
        });
        this.signer = new ArweaveSigner(this.jwk);
    }

    async upload(data: Buffer, tags: Tag[]): Promise<string> {
        const tx = await this.arweaveClient.createTransaction({ data }, this.jwk);

        for (const tag of tags) tx.addTag(tag.name, tag.value);

        await this.arweaveClient.transactions.sign(tx, this.jwk)
        const uploader = await this.arweaveClient.transactions.getUploader(tx)

        while (!uploader.isComplete) {
            await uploader.uploadChunk();
        }

        return tx.id;
    }

    async bundleAndUploadDataItems(dataItems: DataItem[]): Promise<{ bundleTxId: string; dataItemsTxIds: string[] }> {
        if (dataItems.length === 0) {
            throw new BadRequestException('No data items to upload');
        }

        const bundle = await bundleAndSignData(dataItems, this.signer);

        const tx = await this.arweaveClient.createTransaction({ data: bundle.getRaw() }, this.jwk);
        tx.addTag('Bundle-Format', 'binary')
        tx.addTag('Bundle-Version', '2.0.0')

        await this.arweaveClient.transactions.sign(tx, this.jwk)
        const uploader = await this.arweaveClient.transactions.getUploader(tx)

        while (!uploader.isComplete) {
            await uploader.uploadChunk();
        }

        return {
            bundleTxId: tx.id,
            dataItemsTxIds: dataItems.map(item => item.id)
        };
    }

    static async isSignedValidDataItemsInBundle(data: Buffer): Promise<boolean> {
        const bundle = new Bundle(data);

        const isValid = await bundle.verify();

        if (!isValid) {
            return false;
        }

        for (let i = 0; i < bundle.length; i++) {
            const dataItem = bundle.get(i);

            if (!dataItem.isSigned()) {
                return false;
            }
        }

        return true;
    }

    static createDataItem(data: Buffer): DataItem {
        const dataItem = new DataItem(data);

        return dataItem;
    }

    static unpackBundle(data: Buffer): DataItem[] {
        const bundle = new Bundle(data);

        const dataItems: DataItem[] = [];

        for (let i = 0; i < bundle.length; i++) {
            const dataItem = bundle.get(i);

            dataItems.push(dataItem);
        }

        return dataItems;
    }
}