require('dotenv').config();
const fetch = require('node-fetch');
const { Pool } = require('pg');
const Discord = require('discord.js');
const he = require('he');
const client = new Discord.Client();

const db_url = "postgres://haxrmdohtdpejz:5acd0ec4ab5be0cb9e3016bd47a9763576cdce4e73b66298a89fa7e8a3838983@ec2-23-23-92-204.compute-1.amazonaws.com:5432/d1gavj00p2427f";

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

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}  

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
})

client.on('message', async(msg) => {
    const words = msg.content.split(' ');

    if (words[0] === '!trivia') {
        const username = msg.member.user.username + '#' + msg.member.user.discriminator;
        const server_name = msg.member.guild.name;

        if (words[1] === 'about') {
            msg.channel.send("Trivia Bot by Luke Rowell\nPowered by Open Trivia Database: https://opentdb.com/\nSource: https://github.com/LukeRowell/Trivia-Bot");
        } else if (words[1] === 'answer') {
            if (words[2] == null) {
                msg.channel.send("No answer given. To answer type \"!trivia answer\" followed by the letter of your choice.");
            } else {
                const queryText = `SELECT answering FROM trivia WHERE username = $1 AND server_name = $2;`;
                const queryValues = ['test_name', 'test_server'];
                const result = await queryDB(db_url, queryText, queryValues);

                console.log(result.rows[0]);

                if (result.rows.length > 0) {
                    if (result.rows[0]) {
                        msg.channel.send("You are currently answering a question.");
                    } else {
                        msg.channel.send("You aren't currently answering a question! Type \"!trivia question\" to get a question.");
                    }
                } else {
                    msg.channel.send("You aren't currently answering a question! Type \"!trivia question\" to get a question.")
                }
            }
        } else if (words[1] === 'help' || words[1] === 'commands') {
            let helpMessageString = `**Command format:** !trivia your_command_here\n\n__Commands__:\nabout - Displays information about Trivia Bot.\nanswer - Answer the current question.\nhelp/commands - Get a list of commands for Trivia Bot.\nhowto/rules - Explains rules and how Trivia Bot works.\nleaderboard - Shows the leaderboard for this server.\npoints - Shows you your current point total in this server.\nquestion - Get a new question to answer.`;
            msg.channel.send(helpMessageString);
        } else if (words[1] === 'howto' || words[1] === 'rules') {
            let howtoMessageString = `To play trivia simply type "!trivia question" to get a question. To answer that question type "!trivia answer" followed by the letter of the correct answer. Ex. - !trivia answer B.\n\nAnswering questions correctly will reward you with 100, 300, or 500 points depending on if the question is easy, medium, or hard difficulty. Incorrect answers will subtract the same amount of points from your point total.\n\n**Note: **Each user is limited to one question every 30 seconds.`;
            msg.channel.send(howtoMessageString);
        } else if (words[1] === 'leaderboard') {
            const queryText = `SELECT username, points FROM trivia WHERE server_name = $1 ORDER BY points DESC LIMIT 10;`;
            const queryValues = [server_name];
            const result = await queryDB(db_url, queryText, queryValues);

            if (result.rows.length > 0) {
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
        } else if (words[1] === 'points') {
            const queryText = `SELECT points FROM trivia WHERE username = $1 AND server_name = $2;`
            const queryValues = [username, server_name];
            const result = await queryDB(db_url, queryText, queryValues);

            if (result.rows.length == 0) {
                msg.reply(`You don't have any points yet! Type \"!trivia question\" to get a question.`);
            } else {
                msg.reply(`Your total points in ${server_name}: ${result.rows[0]}`);
            }
        } else if (words[1] === 'question') {
            const queryText = `SELECT * FROM trivia WHERE username = $1 AND server_name = $2;`;
            const queryValues = [username, server_name];
            const result = await queryDB(db_url, queryText, queryValues);

            if (result.rows.length > 0) {   //If there is some data for this user
                const answering = result.rows[0][10];
                if (answering) {   //If the user is currently answering a question, give them the information about their current question
                    const category = result.rows[0][2];
                    const question_type = result.rows[0][3];
                    const difficulty = result.rows[0][4];
                    const question = result.rows[0][5];
                    const answers = result.rows[0][6];
                    msg.reply(`\n__Your current question__:\nCategory: ${category}\nQuestion Type: ${question_type}\nDifficulty: ${difficulty}\n\nQuestion: ${question}\n\n${answers}`);
                } else {    //If the user is not currently answering a question, give them a new one
                    msg.channel.send("Here's a new question.");
                }
            } else {    //If there is no data for this user, get them their first question
                const opentdb_response = await fetch('https://opentdb.com/api.php?amount=1');
                const opentdb_response_json = await opentdb_response.json();
                const category = opentdb_response_json.results[0].category;
                const question_type = he.decode(opentdb_response_json.results[0].type);
                const difficulty = opentdb_response_json.results[0].difficulty;
                const question = he.decode(opentdb_response_json.results[0].question);
                const correct_answer = he.decode(opentdb_response_json.results[0].correct_answer);
                let answers = (opentdb_response_json.results[0].incorrect_answers).map(x => he.decode(x));
                let correct_answer_index;

                answers.push(correct_answer);
                answers = shuffle(answers);

                for (const [index, answer] of answers.entries()) {
                    if (answer === correct_answer) {
                        correct_answer_index = index;
                        console.log("Index of correct answer: ", correct_answer_index);
                    }
                }

                const queryText = `INSERT INTO trivia VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, to_timestamp(${Date.now()} / 1000.0));`;
                const queryValues = [username, server_name, category, question_type, difficulty, question, answers, correct_answer_index, 0, 't'];
                await queryDB(db_url, queryText, queryValues);

                console.log('Category: ' + category);
                console.log('Question Type: ' + question_type);
                console.log('Difficulty: ' + difficulty);
                console.log('Question: ' + question);
                console.log('Correct Answer: ' + correct_answer);
                console.log('Answers: ' + answers);
            }

        } else {
            msg.channel.send("Sorry, I didn't recognize that command. Type \"!trivia help\" for a list of commands.");
            console.log(username);
            console.log(server_name);
        }
    }
})

client.login(process.env.BOT_TOKEN);