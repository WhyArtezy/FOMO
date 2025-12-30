const { ethers } = require("ethers");

// HTTP RPC (STABIL)
const RPC_URL = "https://arb1.arbitrum.io/rpc";

const TRACK_ADDRESS = "0x135c653984c9e098cbe46529945733de6643f5f3".toLowerCase();
const VSN_SYMBOL = "VSN";

const provider = new ethers.JsonRpcProvider(RPC_URL);

// Transfer topic (v6)
const TRANSFER_TOPIC = ethers.id(
  "Transfer(address,address,uint256)"
);

function timeAgo(ts) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  return `${Math.floor(diff / 3600)} jam lalu`;
}

console.log("🚀 REAL-TIME VSN OUT TRACKER STARTED (HTTP MODE)");

let lastBlock = 0;

async function poll() {
  try {
    const currentBlock = await provider.getBlockNumber();
    if (lastBlock === 0) lastBlock = currentBlock - 1;

    const logs = await provider.getLogs({
      fromBlock: lastBlock + 1,
      toBlock: currentBlock,
      topics: [TRANSFER_TOPIC],
    });

    const iface = new ethers.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ]);

    for (const log of logs) {
      try {
        const parsed = iface.parseLog(log);
        const from = parsed.args.from.toLowerCase();
        if (from !== TRACK_ADDRESS) continue;

        const to = parsed.args.to;
        const value = parsed.args.value;

        const block = await provider.getBlock(log.blockNumber);
        const amount = Number(ethers.formatUnits(value, 18));

        console.log(
          `${to} ${amount} ${VSN_SYMBOL} ${timeAgo(block.timestamp)}`
        );
      } catch {}
    }

    lastBlock = currentBlock;
  } catch (e) {
    console.error("⚠️ Poll error:", e.message);
  }

  setTimeout(poll, 500); // polling tiap 3 detik
}

poll();
