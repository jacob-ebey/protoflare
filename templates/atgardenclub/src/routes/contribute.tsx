import { getSession } from "protoflare/server";
import { href } from "react-router";
import { Button } from "react-aria-components";

import { logoutAction } from "#actions";
import { Main, Shell } from "#components/layout";
import { defaultStyle } from "#og-styles";

import { ContributeForm, LoginForm } from "./contribute.client";

export default function Contribute() {
  const session = getSession();
  const user = session.get("user");

  return (
    <>
      <title>Contribute | AT Garden Club</title>
      <meta
        name="description"
        content="Submit your own CSS stylesheet to AT Garden Club! Share your creativity with the AT Proto community and own your data through decentralized submissions."
      />
      <link
        rel="stylesheet"
        href={`https://stylestage.dev/styles/css/${defaultStyle.id}.css`}
      />

      <Shell
        title="Contribute"
        description="Bring your own flavors to the garden"
      >
        <Main>
          <article>
            <section className="container">
              <p>
                Create your own unique stylesheet for the AT Garden Club! Share
                your CSS creativity with the AT Proto community by submitting
                your custom design.
              </p>
              <p>
                Before submitting, please review the{" "}
                <a href={href("/resources")}>resources page</a> for guidelines,
                tips, and source files to help you get started.
              </p>
            </section>
            <section className="container">
              {user ? <ContributeForm /> : <LoginForm />}
            </section>
          </article>
          {user ? (
            <aside>
              <section className="container">
                <p>
                  You can edit your styles on{" "}
                  <a
                    href={`https://pdsls.dev/at://${user.handle}/club.atgarden.stylestage`}
                  >
                    https://pdsls.dev
                  </a>
                </p>
                <form action={logoutAction} style={{ textAlign: "center" }}>
                  <Button type="submit">Logout</Button>
                </form>
              </section>
            </aside>
          ) : null}
        </Main>
      </Shell>
    </>
  );
}
