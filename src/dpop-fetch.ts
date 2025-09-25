import * as DPOP from "dpop";

export async function dpopFetch({
  accessToken,
  createRequest,
  keypair,
  nonce,
  retry = true,
}: {
  accessToken?: string;
  createRequest: () => Request;
  keypair: DPOP.KeyPair;
  nonce: string;
  retry?: boolean;
}): Promise<[nonce: string, response: Response]> {
  const request = createRequest();
  if (accessToken) {
    request.headers.set("Authorization", `DPoP ${accessToken}`);
  }
  request.headers.set(
    "DPoP",
    await DPOP.generateProof(
      keypair,
      (() => {
        const url = new URL(request.url);
        url.search = "";
        return url.href;
      })(),
      request.method,
      nonce,
      accessToken,
    ),
  );

  const response = await fetch(request);
  if ((response.status === 400 || response.status === 401) && retry) {
    const json = await response
      .clone()
      .json()
      .catch(() => null);
    if (
      json &&
      typeof json === "object" &&
      "error" in json &&
      json.error === "use_dpop_nonce"
    ) {
      const retryNonce = response.headers.get("DPoP-Nonce");
      if (!retryNonce) {
        throw new Error("Failed to get new nonce");
      }

      // consume to not leak memory
      response.bytes().catch(() => {});

      const retryRequest = createRequest();
      if (accessToken) {
        retryRequest.headers.set("Authorization", `DPoP ${accessToken}`);
      }
      retryRequest.headers.set(
        "DPoP",
        await DPOP.generateProof(
          keypair,
          (() => {
            const url = new URL(retryRequest.url);
            url.search = "";
            return url.href;
          })(),
          retryRequest.method,
          retryNonce,
          accessToken,
        ),
      );

      const retryResponse = await fetch(retryRequest);
      const resultNonce = retryResponse.headers.get("DPoP-Nonce") || retryNonce;
      return [resultNonce, retryResponse];
    }
  }

  return [response.headers.get("DPoP-Nonce") || nonce, response];
}
