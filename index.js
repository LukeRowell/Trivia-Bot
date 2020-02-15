require('dotenv').config();
const fetch = require('node-fetch');
const { Pool } = require('pg');
const Discord = require('discord.js');
const client = new Discord.Client();

const db_url = "";

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

client.on('message', async(msg) => {
    const words = msg.content.split(' ');

    if (words[0] === '!trivia') {
        const username = msg.member.user.username + '#' + msg.member.user.discriminator;
        const server_name = msg.member.guild.name;

        if (words[1] === 'help' || words[1] === 'commands') {
            let helpMessageString = `__Commands__: !trivia <COMMAND>\nquestion: `;
            msg.channel.send(helpMessageString);
        } else if (words[1] === "question") {
            const opentdb_response = await fetch('https://opentdb.com/api.php?amount=1');
            const opentdb_response_json = await opentdb_response.json();
            const category = opentdb_response_json.results[0].category;
            const question_type = opentdb_response_json.results[0].type;
            const difficulty = opentdb_response_json.results[0].difficulty;
            const question = opentdb_response_json.results[0].question;
            const correct_answer = opentdb_response_json.results[0].correct_answer;
            const incorrect_answers = (opentdb_response_json.results[0].incorrect_answers).toString();

            console.log('Category: ' + category);
            console.log('Question Type: ' + question_type);
            console.log('Difficulty: ' + difficulty);
            console.log('Question: ' + question);
            console.log('Correct Answer: ' + correct_answer);
            console.log('Incorrect Answer(s): ' + incorrect_answers);
            /*
            const queryText = `SELECT answering FROM trivia WHERE username = $1 AND server_name = $2;`;
            const queryValues = [username, server_name];
            const result = await queryDB(db_url, queryText, queryValues);

            if (result.rows.length == 0) {     //user has no record in this server
                const queryText = ``
            } else {    //user does have a record in this server
                
            }
            msg.reply("Question");
            */
        } else if (words[1] === "answer") {
            msg.reply("Answer test");
        } else if (words[1] === "giveup") {
            msg.reply("You gave up on your current question. Better luck next time!");
        } else if (words[1] === "points") {
            const queryText = `SELECT points FROM trivia WHERE username = $1 AND server_name = $2;`
            const queryValues = [username, server_name];
            const result = await queryDB(db_url, queryText, queryValues);

            if (result.rows.length == 0) {
                msg.reply(`You don't have any points yet! Type \"!trivia question\" to get a question.`);
            } else {
                msg.reply(`Your total points in ${server_name}: ${result.rows[0]}`);
            }
        } else if (words[1] === "leaderboard") {
            const queryText = `SELECT username, points FROM trivia WHERE server_name = $1 ORDER BY points DESC LIMIT 10;`;
            const queryValues = [server_name];
            const result = await queryDB(db_url, queryText, queryValues);

            if (result.rows > 0) {
                let leaderboardMessageString = `🏆 Galaxy Brains of ${server_name} 🏆\n\n`;
                let placeString;
                let nameString;
                let pointsString;
                let place = 1;
    
                for (user of result.rows) {
                    if (place == 1) {
                        placeString = '🥇';
                    } else if (place == 2) {
                         placeString = '🥈'
                    } else if (place == 3) {
                        placeString = '🥉';
                    } else if (place == 10) {
                        placeString = `${place}.                         `;
                    } else {
                        placeString = `${place}.                          `;
                    }
    
                    nameString = `${user[0]}`;
                    pointsString = `${user[1]}`;
                    leaderboardMessageString += placeString.padEnd(25, ' ') + nameString + '   (' + pointsString + ')' + '\n';
                    place += 1;
                }
    
                msg.channel.send(leaderboardMessageString);
            } else {
                msg.reply(`There's no one on the leaderboard for ${server_name}. You can be #1! Type \"!trivia question\" to get a question.`);
            }
        } else {
            msg.channel.send("Sorry, I didn't recognize that command. Type \"!trivia help\" for a list of commands.");
            console.log(username);
            console.log(server_name);
            /*const queryText = `SELECT * FROM pokemon WHERE name = $1;`;
            const queryValues = [`bulbasaur`];
            const result = await queryDB(db_url, queryText, queryValues);
            let formattedResults = [];
    
            for (item of result.rows) {
                const entry = {
                    name: item[0],
                    ndexno: item[1], 
                    generation: item[2],
                    type1: item[3],
                    type2: item[4],
                    hp: item[5],
                    atk: item[6],
                    def: item[7],
                    spatk: item[8],
                    spdef: item[9],
                    spd: item[10],
                    total: item[11],
                    bulba_name: item[12]
                }
    
                formattedResults.push(entry);
            }
    
            console.log(msg.member);
            msg.reply(formattedResults[0].name);*/
        }
    }
})

client.login(process.env.BOT_TOKEN);