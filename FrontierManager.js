require('dotenv').config();
const Discord = require('discord.js');
const CommunityClient = new Discord.Client({
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
const DiscordHelper = require('./Library/DiscordHelper.js');
const RobloxHelper = require('./Library/RobloxHelper.js');
const CommunityCommands = require('./Library/FrontierManagerCommands/commands');

const roleReactionSetup = async () => {
    const msgId = "817110322681872434";

    // Roles
    const colonist  = '817103889374904380';
    const native    = '817104033524219904';
    const hbc       = '817104057780011058';

    CommunityClient.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot || !reaction.message.guild) return;

        if (reaction.message.id == msgId) {
            const member = reaction.message.guild.members.cache.get(user.id);
            if (reaction.emoji.identifier == '%F0%9F%87%A8%F0%9F%87%A6') {
                member.roles.add(colonist);
            } else if (reaction.emoji.name === '🦅') {
                member.roles.add(native);
            } else if (reaction.emoji.id == '817118890483253329' || DiscordHelper.isVerified(member)) {
                const userId = await RobloxHelper.getUserIdFromDiscordId(user.id)
                const groupRank = await RobloxHelper.getRankInGroup(userId, process.env.HBC_GROUP_ID)
                if (groupRank > 1) {
                    member.roles.add(hbc);
                }
            }
        }
    });

    CommunityClient.on('messageReactionRemove', async (reaction, user) => {
        if (user.bot || !reaction.message.guild) return;
        if (reaction.message.id == msgId) reaction.guild.members.cache.get(user.id).roles.remove([ colonist, native, hbc ]);
    });
}

// Client Events
CommunityClient.on('ready', async () => {
    console.log(`Logged in as ${CommunityClient.user.tag}`);
    roleReactionSetup()

    const guild = CommunityClient.guilds.cache.get('805853313643577344');
    let commands = guild.commands

    for (const cmd in CommunityCommands) {
        commands?.create(CommunityCommands[cmd].info)
    }
});

CommunityClient.on('interactionCreate', async interaction => {
    if (!interaction.isCommand) return;
    
    if (CommunityCommands[interaction.commandName]) {
        CommunityCommands[interaction.commandName].run(interaction)
    }
})

CommunityClient.login(process.env.COMMUNITY_MANAGER_TOKEN);