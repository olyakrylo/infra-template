const fetch = require("node-fetch");
const github = require("@actions/github");

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
  const commits = github.context.payload.commits?.map((c) => {
    return `${c.id} ${c.author.name} ${c.author.message}`
  })
  const currentTag = github.context.payload.ref.replace("refs/tags/rc-", "");

  const pusherName = github.context.payload.pusher?.name;
  const pushDate = new Date().toLocaleDateString();

  const summary = `Релиз №${currentTag} от ${pushDate}`;
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

updateTicket().then(() => console.info("Successfully done!"));


// original name
// Кросс-проверка Инфраструктура — Крылова Ольга