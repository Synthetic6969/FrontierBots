require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client({
    intents : new Discord.Intents(32767),
    presence : {
        'activities' : [{
            name : 'FRONTIER',
            type : "PLAYING",
            url : "https://www.roblox.com/games/7991224025/"
        }],
        status : 'dnd'
    }
});
const DiscordHelper = require('./Library/DiscordHelper.js');
const RobloxHelper = require('./Library/RobloxHelper.js');
const cmds = require('./Library/FrontierManagerCommands/commands');

const roleReactionSetup = async () => {
    const msgId = "817110322681872434";
    const guild = client.guilds.cache.get('805853313643577344');
    const message = client.channels.cache.get('817105824224641097').messages.fetch(msgId);

    // Roles
    const colonist = '817103889374904380';
    const native = '817104033524219904';
    const hbc = '817104057780011058';

    const removeOldRoles = async (reaction, user) => {
        await guild.members.cache.get(user.id).roles.remove(colonist);
        await guild.members.cache.get(user.id).roles.remove(native);
        await guild.members.cache.get(user.id).roles.remove(hbc);
    }

    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot || !reaction.message.guild) return;

        if (reaction.message.id == msgId) {
            const member = reaction.message.guild.members.cache.get(user.id);
            if (reaction.emoji.identifier == '%F0%9F%87%A8%F0%9F%87%A6') {
                member.roles.add(colonist);
            } else if (reaction.emoji.name === '🦅') {
                member.roles.add(native);
            } else if (reaction.emoji.id == '817118890483253329') {
                const userId = await RobloxHelper.getUserIdFromDiscordId(user.id)
                const groupRank = await RobloxHelper.getRankInGroup(userId, process.env.HBC_GROUP_ID)
                if (groupRank > 1) {
                    member.roles.add(hbc);
                }
            }
        }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
        if (user.bot || !reaction.message.guild) return;
        if (reaction.message.id == msgId) removeOldRoles(reaction, user)
    });
}

// Client Events
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    roleReactionSetup()

    const guild = client.guilds.cache.get('805853313643577344');
    let commands = guild.commands

    for (const cmd in cmds) {
        commands?.create(cmds[cmd].info)
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand) return;
    
    if (cmds[interaction.commandName]) {
        cmds[interaction.commandName].run(interaction)
    }
})

console.log(process.env.COMMUNITY_MANAGER_TOKEN);
client.login(process.env.COMMUNITY_MANAGER_TOKEN);