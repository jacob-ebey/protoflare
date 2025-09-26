(async function () {
  const ws = new WebSocket(
    `wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=xyz.statusphere.status`,
  );
  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.did === "did:plc:twegdcgytckr5cxm57gyruxa") {
      console.log(data);
      console.log();
    }
  });
})();
