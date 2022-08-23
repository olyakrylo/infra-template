const fetch = require("node-fetch");
const github = require("@actions/github");
const exec = require("@actions/exec");

require("dotenv").config();

const { TICKET_ID, OAUTH_TOKEN, ORG_ID, API_HOST } = process.env;

const headers = {
  Authorization: `OAuth ${OAUTH_TOKEN}`,
  "X-Org-ID": ORG_ID,
};

const main = async () => {
  const currentTag = github.context.payload.ref?.replace("refs/tags/", "") ?? "";

  await exec.exec('docker', ['build', '-t', `app:${currentTag}`, '.']);
  console.info("Image built");
  console.info("Listen on port 3000");

  await fetch(`${API_HOST}/v2/issues/${TICKET_ID}/comments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      text: `Собрали образ с тегом ${currentTag}`
    })
  });
  console.info("Comment added");
}

main().then(() => console.info("Successfully done!"));