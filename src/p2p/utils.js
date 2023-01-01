const { argv } = process;

// extract ports from process arguments
function extractPeersAndMyPort() {
    return {
        me: argv[2],
        peers: argv.slice(3, argv.length),
    };
}

//['2000', '3000'] -> ['127.0.0.1:2000', '127.0.0.1:3000']
function getPeerIps(ports) {
    return ports.map((port) => toLocalIp(port));
}

//'2000' -> '127.0.0.1:2000'
function toLocalIp(port) {
    return `127.0.0.1:${port}`;
}

//'127.0.0.1:2000' -> '2000'
function extractPortFromIp(ipWithPort) {
    return ipWithPort
        .toString()
        .slice(ipWithPort.length - 4, ipWithPort.length);
}

function extractMessage(jsonMsg) {
    try {
        return JSON.parse(jsonMsg.trim());
    } catch {
        // invalid json msg
        return null;
    }
}

function formatMessage(msg) {
    return JSON.stringify(msg);
}

module.exports.utils = {
    extractPeersAndMyPort,
    getPeerIps,
    extractPortFromIp,
    extractMessage,
    formatMessage,
    toLocalIp,
};
