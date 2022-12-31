const {Client, Intents, MessageButton, MessageActionRow} = require('discord.js');

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]
});

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');

const {    BotToken    } = require('./config.json');

var games = []; //the holy array


const commands = [
    new SlashCommandBuilder().setName('ttt').setDescription('Start a TicTacToe game with another player, or tag a bot to play against AI instead!')
    .addUserOption(option => option.setName('user').setRequired(true).setDescription('Select your opponent')),

    new SlashCommandBuilder().setName('endttt').setDescription('Leave your current TTT match')
].map(command => command.toJSON());

function createBoard(game, userid, opponent, disabled=false){
    let buttons = [];
    for (let i = 1; i <= 9; i++) {
        let btn = new MessageButton();
        btn.setLabel(game.split('')[i-1])
        .setCustomId(`TTT_${userid}_${opponent}_${i}`);
        let symbol = game.split('')[i-1]
        if(symbol == '?'){
            btn.setStyle('SECONDARY');
        }else{
            if(symbol == 'X') btn.setStyle('DANGER')
            if(symbol == 'O') btn.setStyle('PRIMARY')
        }
        if(disabled) btn.setDisabled(true);
        buttons.push(btn)
    }
    let buttonRow1 = new MessageActionRow()
        .addComponents(
            buttons[0], buttons[1], buttons[2]
        );
    let buttonRow2 = new MessageActionRow()
        .addComponents(
            buttons[3], buttons[4], buttons[5]
        );
    let buttonRow3 = new MessageActionRow()
        .addComponents(
            buttons[6], buttons[7], buttons[8]
        );

    return [buttonRow1, buttonRow2, buttonRow3]
}


function checkWinner(s){
    let winner = false;
    if(s[0] == s[1] && s[1] == s[2] && s[0]!='?') winner = s[0];
    if(s[3] == s[4] && s[4] == s[5] && s[3]!='?') winner = s[3];
    if(s[6] == s[7] && s[7] == s[8] && s[6]!='?') winner = s[6];

    if(s[0] == s[3] && s[3] == s[6] && s[0]!='?') winner = s[0];
    if(s[1] == s[4] && s[4] == s[7] && s[1]!='?') winner = s[1];
    if(s[2] == s[5] && s[5] == s[8] && s[2]!='?') winner = s[2];

    if(s[0] == s[4] && s[4] == s[8] && s[0]!='?') winner = s[0];
    if(s[2] == s[4] && s[4] == s[6] && s[2]!='?') winner = s[2];
    return winner;
}

function botAlgorithim(s){
    //bot will try and find its own two connecting O's and then fill in that one with high priority
    //bot will then try and find two X's in a row then try to block it off.
    if(!Array.isArray(s)) s = s.split('');
    
    let empty = '?' //placeholder

    let winningIndex = -1;
    let blockingIndex = -1;

    let openIndexes = [] // = [symbol, openindex]
    //HORIZONTAL
    if(s[0] == s[1] && s[2] == empty) openIndexes.push([s[0], 2]);
    if(s[0] == s[2] && s[1] == empty) openIndexes.push([s[0], 1]);
    if(s[1] == s[2] && s[0] == empty) openIndexes.push([s[1], 0]);
    
    if(s[3] == s[4] && s[5] == empty) openIndexes.push([s[3], 5]);
    if(s[3] == s[5] && s[4] == empty) openIndexes.push([s[3], 4]);
    if(s[4] == s[5] && s[3] == empty) openIndexes.push([s[4], 3]);

    if(s[6] == s[7] && s[8] == empty) openIndexes.push([s[6], 8]);
    if(s[6] == s[8] && s[7] == empty) openIndexes.push([s[6], 7]);
    if(s[7] == s[8] && s[6] == empty) openIndexes.push([s[7], 6]);

    //VERTICAL
    if(s[0] == s[3] && s[6] == empty) openIndexes.push([s[0], 6]);
    if(s[0] == s[6] && s[3] == empty) openIndexes.push([s[0], 3]);
    if(s[3] == s[6] && s[0] == empty) openIndexes.push([s[3], 0]);
    
    if(s[1] == s[4] && s[7] == empty) openIndexes.push([s[1], 7]);
    if(s[1] == s[7] && s[4] == empty) openIndexes.push([s[1], 4]);
    if(s[4] == s[7] && s[1] == empty) openIndexes.push([s[4], 1]);

    if(s[2] == s[5] && s[8] == empty) openIndexes.push([s[2], 8]);
    if(s[2] == s[8] && s[5] == empty) openIndexes.push([s[2], 5]);
    if(s[5] == s[8] && s[2] == empty) openIndexes.push([s[5], 2]);

    //DIAGONAL
    if(s[0] == s[4] && s[8] == empty) openIndexes.push([s[0], 8]);
    if(s[0] == s[8] && s[4] == empty) openIndexes.push([s[0], 4]);
    if(s[4] == s[8] && s[0] == empty) openIndexes.push([s[4], 0]);
    
    if(s[2] == s[4] && s[6] == empty) openIndexes.push([s[2], 6]);
    if(s[2] == s[6] && s[4] == empty) openIndexes.push([s[2], 4]);
    if(s[6] == s[4] && s[2] == empty) openIndexes.push([s[6], 2]);
    for(let i of openIndexes){
        //so only issue is that the above code will push data to openIndexes if ? = ? and then the third square = ? but i check for X and O here anyway so it doesnt matter
        if(i[0] == 'X') blockingIndex = i[1];
        if(i[0] == 'O') winningIndex = i[1];
    }
    if(winningIndex !== -1){
        return winningIndex;
    }else if (blockingIndex !== -1){
        return blockingIndex
    }else{
        return -1;
    }
}



// client.on('messageCreate', async message => {
//     if(message.content.toLowerCase().startsWith("!ttt")){
      
//     }

//     if( message.content.toLowerCase().startsWith("!leavettt") ||
//         message.content.toLowerCase().startsWith("!endttt")){
   
//     }
// });



client.on('interactionCreate', async (interaction) => {
    if(interaction.isCommand()){
        const { commandName, options } = interaction;
        if(commandName == "ttt"){
            let opponent = interaction.options.getUser('user');
            let userid = interaction.user.id;

            console.log(opponent);
 
            console.log(userid);
            if(!opponent) return message.reply('You must ping a user to play with');
            if(opponent.id == userid && !opponent.bot) return message.reply('You cannot play against yourself')
        
            if(games[userid]) return message.reply('You are already in a game. To exit, use !leavettt')
            if(games[opponent.id]) return message.reply('This user is already in a game. To exit, use !leavettt');
            let board = createBoard('?????????', userid, opponent.id)
        
            let turn = userid;
            let players = [userid, opponent.id];
            let player1 = userid;
            let player2 = opponent.id
            let channelID = interaction.channel.id;
            turn = players[Math.floor(Math.random()*2)];
            let msgid;
            interaction.channel.send({
               content: `<@${interaction.user.id}> has started a game of TicTacToe with <@${opponent.id}>. \n<@${turn}>'s Turn!`,
               components: [...board]
            }).then(sent => {
                interaction.deferReply();
                msgid = sent.id
                console.log(msgid, 'was sent by the bot')
                let winner = false;
                let bot = false;
                if(opponent.bot){
                    bot = true;
                }
                games[userid] = [player1, player2, turn, '?????????', msgid, winner, bot, channelID];
                if(turn == opponent.id && bot){
                    let firstscore = '?????????'.split('');
                    let randomguess = Math.floor(Math.random()*8);
                    firstscore[randomguess] = 'O';
                    console.log(firstscore.join(''))
                    let newBoard = createBoard(firstscore.join(''), userid, opponent.id)
                    games[userid][2] = userid;
                    games[userid][3] = firstscore.join('');
                    setTimeout(() => {
                        sent.edit(
                            {
                                content: `<@${interaction.user.id}> has started a game of TicTacToe with <@${opponent.id}>. \n<@${interaction.user.id}>'s Turn!`,
                                components: [...newBoard]
                            });
                    }, 1000);
                }
                
            })
        }else if (commandName == "endttt"){
            if(games[interaction.user.id]){
                let msgid = games[interaction.user.id][4];
                let channelID = games[interaction.user.id][7];
                let currentScore = games[interaction.user.id][3];
                let disabledBoard = createBoard(currentScore, 0, 0, true);
        
                client.channels.cache.get(channelID).messages.fetch(msgid)
                .then(mesg =>{
                    mesg.edit(`<@${message.author.id}> has forfeit the game. <@${games[interaction.user.id][1]}> has won!`, {components: disabledBoard})
                    games[interaction.user.id] = null;
                    interaction.reply('You have left your ttt game.')
                }) 
                .catch(console.error);
            }else{
                interaction.reply('You are currently not in any ttt games.');
            }
        }

        return;
    }
    
    
    if (!interaction.isButton()) return;
    console.log(interaction.customId);
    let btnData = interaction.customId.split('_')
    console.log(btnData);
    if(btnData[0]!='TTT'){
        try{
            return await interaction.deferUpdate(); //check if button is from ttt game
        }catch(e){
            console.log('unknown interaction, couldnt find the game')
        }
    } 
    if(!games[btnData[1]]){
        console.log('game isnt there');
        try{
            console.log('deferring reply?');
            return await interaction.deferUpdate(); //game doesnt exist
        }catch(e){
            console.log('unknown interaction, couldnt find the game')
        }
    } 
    let member;
    if(interaction.member){
        member = interaction.member
        console.log("found the user", member.user.username);
    }
    if(!member) return console.log('couldnt find member');
    let symbol = '';
    let game = games[btnData[1]];
    let p1;
    let p2;
    let nextTurn;

    if(game[0] == member.user.id){
        symbol = 'X';
        p2 = game[1];
        nextTurn = p2;
    } 
    if(game[1] == member.user.id){
        symbol = 'O';
        p2 = game[0];
        nextTurn = p2;
    }

    if(game[2] != member.user.id) return await interaction.deferUpdate();
    if(game[5] == true) return await interaction.deferUpdate();
    let score = game[3].split('');
    if(score[btnData[3]-1] == 'X' || score[btnData[3]-1] == 'O') return await interaction.deferUpdate();
    score[btnData[3]-1] = symbol;
    let newScore = score.join('');
    game[3] = newScore;
    let s = score;

    let winner = checkWinner(newScore);
    
  
    game[2] = nextTurn;
    let reply =  `<@${game[0]}> has started a game of TicTacToe with <@${game[1]}>. \n<@${nextTurn}>'s Turn!`
    if(winner) {
        reply = `<@${game[0]}> has started a game of TicTacToe with <@${game[1]}>. \n<@${member.user.id}> has won!`;
        game[5] = true;
        games[btnData[1]] = null;

    }else{
        if(newScore.indexOf('?') == -1){
            reply = `<@${game[0]}> has started a game of TicTacToe with <@${game[1]}>. \nThere was a tie!`;
            game[5] = true;
            games[btnData[1]] = null;
            winner = true;
        }
    }
    let newBoard;
    let disabled = false;
    if(winner) disabled = true;
    if(symbol == 'X') newBoard = createBoard(newScore, member.user.id, btnData[2], disabled); //means clicker is player1
    if(symbol == 'O') newBoard = createBoard(newScore, btnData[1], member.user.id, disabled); //means clicker is player1

    interaction.message.edit({
        content: reply,
        components: [...newBoard]
    })
    if(game[6] == true && !winner){ // if theres a bot and still no winner
        let randomGuess = botAlgorithim(newScore);

        if(randomGuess == -1){
            let botOptions = [];
            let index = -1;
            for(let symbol of newScore){
                index++;
                if(symbol == '?'){
                    botOptions.push(index);
                }
            }
            randomGuess = botOptions[Math.floor(Math.random()* botOptions.length)];
        }
        if(randomGuess > -1){
            score[randomGuess] = 'O';
            let newNewScore = score.join('');
            game[3] = newNewScore;
            let nextTurn = game[0];
            game[2] = nextTurn;
            let botWinner = checkWinner(newNewScore.split(''));
            let reply =  `<@${game[0]}> has started a game of TicTacToe with <@${game[1]}>. \n<@${nextTurn}>'s Turn!`
            if(botWinner){
                reply = `<@${game[0]}> has started a game of TicTacToe with <@${game[1]}>. \n<@${game[1]}> has won!`;
                game[5] = true;
                 games[btnData[1]] = null;

            }else{
                if(newNewScore.split('').indexOf('?') == -1){
                    reply = `<@${game[0]}> has started a game of TicTacToe with <@${game[1]}>. \nThere was a tie!`;
                    game[5] = true;
                    games[btnData[1]] = null;

                }
            }
            let disabled = false;
            if(game[5]) disabled = true;
            let newNewBoard = createBoard(newNewScore, btnData[1], member.user.id, disabled)
            await interaction.message.edit({
                content:`<@${game[1]}> is making their turn...`,
                components: [...newBoard]
            });
            let timeToThink = ((Math.random()*2))*1000;
            setTimeout( () => {
                interaction.message.edit({
                    content: reply,
                    components: [...newNewBoard]
                });
             }, timeToThink);
        }else{
            interaction.message.edit({
                content: `You confused <@${game[1]}> and they have given up.`,
                components: [...newBoard]
            });
        }
    }
    try{
        await interaction.deferUpdate();
        
    }catch(e){
        console.log('interaction error with connect 4')
    }
});

client.once('ready', () =>{
    console.log("Tic Tac Toe bot connected");

    const rest = new REST({ version: '9' }).setToken(BotToken);
    
    const guilds = client.guilds.cache.map(guild => {
        return guild.id;
    });
    for(let guild of guilds){
        rest.put(Routes.applicationGuildCommands(client.user.id, guild), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
    }


})  


client.login(BotToken);
