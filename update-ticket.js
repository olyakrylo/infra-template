const fetch = require("node-fetch");
const github = require("@actions/github");
const exec = require("@actions/exec");

require("dotenv").config();

const { TICKET_ID, OAUTH_TOKEN, ORG_ID, API_HOST } = process.env;

const headers = {
  Authorization: `OAuth ${OAUTH_TOKEN}`,
  "X-Org-ID": ORG_ID,
}

const main = async () => {
  const currentTag = github.context.payload.ref?.replace("refs/tags/", "") ?? "";
  const commits = await getCommits(currentTag);

  const pusherName = github.context.payload.pusher?.name;
  const pushDate = new Date().toLocaleDateString();
  console.info("Pusher", pusherName);
  console.info("Date", pushDate);

  const summary = `Релиз №${currentTag.replace("rc-", "")} от ${pushDate}`;
  const description = `Ответственный за релиз: ${pusherName}\n---\nКоммиты, попавшие в релиз:\n${commits}`;

  await fetch(`${API_HOST}/v2/issues/${TICKET_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      summary,
      description,
    })
  });
  console.info("Ticket is successfully updated");
}

const getCommits = async (currentTag) => {
  const tags = (await execCommand('git', ['tag', '--list'])).split("\n")
    .filter(Boolean)
    .sort((a, b) => {
      const aVal = parseInt(a.replace("rc-0.0.", ""), 10);
      const bVal = parseInt(b.replace("rc-0.0.", ""), 10);
      return aVal - bVal;
    });

  const index = tags.indexOf(currentTag);
  const commitsFilter = tags.length === 1 ? currentTag : `${tags[index - 1]}...${currentTag}`;

  const releaseCommits = await execCommand('git', ['log', '--pretty=format:"%H %an %s"', commitsFilter]);
  return releaseCommits.replace(/"/g, "");
}

const execCommand = async (command, options) => {
  let resString = "";
  let errString = "";

  console.log(); // new line

  await exec.exec(command, options, {
    listeners: {
      stdout: (data) => {
        resString += data.toString();
      },
      stderr: (data) => {
        errString += data.toString();
      }
    }
  });

  if (errString) {
    throw new Error(`Unable to execute ${command} ${options}`)
  }

  return resString;
}

main().then(() => console.info("Successfully done!"));