const fetch = require("node-fetch");
const github = require("@actions/github");
const exec = require("@actions/exec");

require("dotenv").config();

const { TICKET_ID, OAUTH_TOKEN, ORG_ID, HOST } = process.env;

const headers = {
  Authorization: `OAuth ${OAUTH_TOKEN}`,
  "X-Org-ID": ORG_ID,
}

// add comment
// fetch(`${HOST}/v2/issues/${TICKET_ID}/comments`, {
//   method: "POST",
//   headers,
//   body: JSON.stringify({
//     text: "test comment"
//   })
// }).then((response) => response.json()).then((res) => console.log(res));

const updateTicket = async () => {
  const currentTag = github.context.payload.ref?.replace("refs/tags/", "") ?? "";
  console.info("Tag", currentTag)

  const commits = await getCommits(currentTag);
  console.info("Commits", commits);

  console.log(github.context.payload);

  const pusherName = github.context.payload.pusher?.name;
  const pushDate = new Date().toLocaleDateString();
  console.info("Pusher");
  console.info("Date", pushDate);

  const summary = `Релиз №${currentTag.replace("rc-", "")} от ${pushDate}`;
  const description = `Ответственный за релиз: ${pusherName}\n---\nКоммиты, попавшие в релиз:\n${commits}`;

  fetch(`${HOST}/v2/issues/${TICKET_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      summary,
      description,
    })
  }).then((response) => response.json()).then((res) => {
    console.info("Ticket is successfully updated");
  });
}

const getCommits = async (currentTag) => {
  const tags = (await execCommand('git', ['tag'])).split("\n").filter(Boolean);
  const index = tags.indexOf(currentTag);
  const commitsFilter = tags.length === 1 ? currentTag : `${currentTag}...${tags[index - 1]}`;
  const releaseCommits = await execCommand('git', ['log', '--pretty=format:"%h %an %s"', commitsFilter]);
  return releaseCommits.replace(/"/g, "");
}

const execCommand = async (command, options) => {
  let resString = "";
  let errString = "";

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

updateTicket().then(() => console.info("Successfully done!"));

// original name
// Кросс-проверка Инфраструктура — Крылова Ольга