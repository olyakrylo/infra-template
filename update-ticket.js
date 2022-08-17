const fetch = require("node-fetch");
const exec = require("@actions/exec");
const github = require("@actions/github");

require("dotenv").config();

const { TICKET_ID, OAUTH_TOKEN, ORG_ID, HOST } = process.env;

const headers = {
  Authorization: `OAuth ${OAUTH_TOKEN}`,
  "X-Org-ID": ORG_ID,
}

const main = async () => {
  const tags = (await execCommand('git', ['tag'])).split("\n").filter(Boolean);
  const currentTag = tags[tags.length - 1];

  const commits = await getCommits(tags, currentTag); // commits list for task description

  await updateTicket(currentTag, commits);

  // add comment
  // fetch(`${HOST}/v2/issues/${TICKET_ID}/comments`, {
  //   method: "POST",
  //   headers,
  //   body: JSON.stringify({
  //     text: "test comment"
  //   })
  // }).then((response) => response.json()).then((res) => console.log(res));
}

const updateTicket = async (currentTag, commits) => {
  const pusherName = github.context.payload.pusher?.name;
  const pushDate = new Date().toLocaleDateString();

  const tagNum = currentTag.replace("rc-", "");

  const summary = `Релиз №${tagNum} от ${pushDate}`;
  const description = `ответственный за релиз \`${pusherName}\`\nкоммиты, попавшие в релиз:\n${commits}`;

  fetch(`${HOST}/v2/issues/${TICKET_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      summary,
      description,
    })
  }).then((response) => response.json()).then((res) => {
    console.log(`Ticket ${TICKET_ID} is successfully updated`);
  });
}

const getCommits = async (allTags, currentTag) => {
  const commitsFilter = allTags.length === 1 ? currentTag : `${currentTag}...${allTags[allTags.length - 2]}`;
  const releaseCommits = await execCommand('git', ['log', '--pretty=format:"%h %an %s"', commitsFilter]);
  return releaseCommits.replace(/"/g, "");
}

const execCommand = async (command, options) => {
  let resString = "";

  await exec.exec(command, options, {
    listeners: {
      stdout: (data) => {
        resString += data.toString();
      },
    }
  });

  return resString;
}

main().then(() => "Successfully done!");


// original name
// Кросс-проверка Инфраструктура — Крылова Ольга