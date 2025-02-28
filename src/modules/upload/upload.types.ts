export interface IEVMTxnReceipt {
    to: string;
    from: string;
    contractAddress: string | null;
    transactionIndex: number;
    gasUsed: {
        _hex: string;
        _isBigNumber: boolean;
    };
    logsBloom: string;
    blockHash: string;
    transactionHash: string;
    logs: {
        transactionIndex: number;
        blockNumber: number;
        transactionHash: string;
        address: string;
        topics: Array<any>;
        data: string;
        logIndex: number;
        blockHash: string;
    }[];
    blockNumber: number;
    confirmations: number;
    cumulativeGasUsed: {
        _hex: string;
        _isBigNumber: boolean;
    };
    effectiveGasPrice: {
        _hex: string;
        _isBigNumber: boolean;
    };
}