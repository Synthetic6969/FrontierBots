require('dotenv').config();
const Database = require('./Config/database');
const Discord = require('discord.js');
const DiscordHelper = require('./Library/DiscordHelper.js');
const RobloxHelper = require('./Library/RobloxHelper.js');
const CompanyCommands = require('./Library/HudsonManagerCommands/commands');

const db = new Database();
db.connect();
const CompanyClient = new Discord.Client({
    intents : 32767,
    presence : {
        'activities' : [{
            name : 'FRONTIER',
            type : "PLAYING",
            url : "https://www.roblox.com/games/7991224025/"
        }],
        status : 'dnd'
    }
});

// Client Events
CompanyClient.on('ready', async () => {
    console.log(`Logged in as ${CompanyClient.user.tag}`);

    const guild = CompanyClient.guilds.cache.get('809854975446351942');
    let commands = guild.commands

    for (const cmd in CompanyCommands) {
        commands?.create(CompanyCommands[cmd].info)
    }
});

CompanyClient.on('guildMemberAdd', member => {
    member.roles.add([
        '918682053657100340', // Unverified
        '920797533868032091', // Buffer
        '921540428782780486', // Buffer
        '810249114612531200', // Settler
    ]);
})

CompanyClient.on('guildMemberRemove', async member => {
    // Check rank in group
    const userId = await RobloxHelper.getUserIdFromDiscordId(member.id)
    if (!userId) return;
    const groupRank = await RobloxHelper.getRankInGroup(userId, process.env.HBC_GROUP_ID)
    if (groupRank > 1) {
        // Dishonourably discharge for desertion
        member.guild.channels.cache.get('920693836903231489').send({embeds : [
            new Discord.EmbedBuilder()
                .setTitle(`Dishonourable Discharge.`)
                .setDescription(`[${await RobloxHelper.getUsernameFromUserId(userId)}](https://www.roblox.com/profile/${userId}) was dishonourably discharged for desertion.`)
                .setFooter({'text': 'Company Manager [ AUTO DD ]'})
                .setTimestamp()
        ]})
        RobloxHelper.setRank(userId, process.env.HBC_GROUP_ID, 'Awaiting Placement')
    }
})

CompanyClient.on('messageCreate', async message => {
    if (message.author.id == message.guild.ownerId || message.author.bot) return;

    if (message.channel.name == "verification") {
        try { message.delete() } catch { err => console.log(err) }
    }
})

CompanyClient.on('interactionCreate', async interaction => {
    if (!interaction.isCommand) return;
    
    if (CompanyCommands[interaction.commandName]) {
        try {
            CompanyCommands[interaction.commandName].run(interaction, CompanyClient)
        } catch (err) {
            console.log(err)
            interaction.deferReply('There was a server error with your request. Please try again, or report this issue to Synthetic.')
        }
    }
})

CompanyClient.login(process.env.HUDSON_MANAGER_TOKEN);