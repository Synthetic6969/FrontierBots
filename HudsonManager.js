require('dotenv').config();
const Database = require('./Config/database');
const Discord = require('discord.js');
const DiscordHelper = require('./Library/DiscordHelper.js');
const RobloxHelper = require('./Library/RobloxHelper.js');
const cmds = require('./Library/HudsonManagerCommands/commands');

const db = new Database();
db.connect();
const client = new Discord.Client({
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
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const guild = client.guilds.cache.get('809854975446351942');
    let commands = guild.commands

    for (const cmd in cmds) {
        commands?.create(cmds[cmd].info)
    }
});

client.on('guildMemberAdd', member => {
    member.roles.add([
        '917009640653475911',
        '917012117738127390',
        '917010970960871474',
        '810249114612531200'
    ]);
})

client.on('guildMemberRemove', async member => {
    // Check rank in group
    const userId = await RobloxHelper.getUserIdFromDiscordId(member.id)
    if (!userId) return;
    const groupRank = await RobloxHelper.getRankInGroup(userId, process.env.HBC_GROUP_ID)
    if (groupRank > 1) {
        // Dishonourably discharge for desertion
        member.guild.channels.cache.get('917074761304137749').send({embeds : [
            new Discord.EmbedBuilder()
                .setTitle(`Dishonourable Discharge.`)
                .setDescription(`[${await RobloxHelper.getUsernameFromUserId(userId)}](https://www.roblox.com/profile/${userId}) was dishonourably discharged for desertion.`)
                .setFooter({'text': 'Company Manager [ AUTO DD ]'})
                .setTimestamp()
        ]})
        RobloxHelper.setRank(userId, process.env.HBC_GROUP_ID, 'Awaiting Placement')
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand) return;
    
    if (cmds[interaction.commandName]) {
        try {
            cmds[interaction.commandName].run(interaction, client)
        } catch (err) {
            console.log(err)
            interaction.deferReply('There was a server error with your request. Please try again, or report this issue to Synthetic.')
        }
    }
})

client.login(process.env.HUDSON_MANAGER_TOKEN);