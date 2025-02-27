import { ArweaveSigner, JWKInterface } from "arbundles";
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
        console.log(this.jwk)
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
}