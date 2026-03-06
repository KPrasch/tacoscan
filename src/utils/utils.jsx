import * as Const from "./Cons";
import { networkConfig } from "./networkConfig";

const getEtherScanLink = () => {
    return networkConfig.etherscan;
}

const getPolygonScanLink = () => {
    return networkConfig.polygonscan;
}

export const getEtherAddressLink = () => {
    return getEtherScanLink() + "/address/"
}

export const getPolygonScanAddressLink = () => {
    return getPolygonScanLink() + "/address/"
}


export const getEtherTxHashLink = () => {
    return getEtherScanLink() + "/tx/"
}

export const getPolygonScanTxHashLink = () => {
    return getPolygonScanLink() + "/tx/"
}

export const getEtherBlockLink = () => {
    return getEtherScanLink() + "/block/"
}

export const getDomain = () => {
    // Use relative path for internal navigation
    // This ensures we stay on the same domain (localhost in dev, production URL in prod)
    return ""
}

export const getBlockStreamInfo = () => {
    if (Const.DEFAULT_NETWORK == Const.NETWORK_MAINNET) {
        return "https://blockstream.info/tx/"
    } else {
        return "https://blockstream.info/testnet/tx/"
    }
}

export function getGroupState(group,currentBlock) {
    //259_200 is group life time, ~30 days assuming 15s block time
    if (group?.terminated || parseInt(group?.createdAtBlock) + Const.GROUP_LIFE_TIME < currentBlock) {
        return "Inactive"
    } else {
        return "Active"
    }
}