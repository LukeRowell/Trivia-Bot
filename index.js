require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();

async function queryDB(dbConnectionString, queryText, queryValues) {
    const pool = new Pool({
        connectionString: dbConnectionString,
        ssl: true,
    });

    const client = await pool.connect()
    const result = await client.query({
      rowMode: 'array',
      text: queryText,
      values: queryValues
    });

    client.release();

    pool.end(() => {
        //console.log(`Pool ended for: ${dbConnectionString}`);
    });

    return result;
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
})

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
})

client.login(process.env.BOT_TOKEN);