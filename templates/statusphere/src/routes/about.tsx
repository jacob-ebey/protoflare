export default function About() {
  return (
    <>
      <title>About | Statusphere</title>
      <meta name="description" content="About this app" />

      <main>
        <article>
          <h1>About This App</h1>
          <p>
            This app demonstrates ATProto OAuth and JetStream ingestion on
            Cloudflare Workers.
          </p>
          <p>Tech stack:</p>
          <ul>
            <li>Cloudflare Workers</li>
            <li>React Router RSC</li>
            <li>React Aria Components</li>
            <li>TypeScript</li>
          </ul>
        </article>
      </main>
    </>
  );
}
