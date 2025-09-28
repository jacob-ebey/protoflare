import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <h1>Hello, world!</h1>
      <Suspense fallback={<p>Loading async data...</p>}>
        <AsyncData />
      </Suspense>
    </>
  );
}

async function AsyncData() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <p>This data was loaded asynchronously!</p>;
}
