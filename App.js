require('dotenv').config();
const Database = require('./Config/database');
const Discord = require('discord.js');
const DiscordHelper = require('./Library/DiscordHelper.js');
const RobloxHelper = require('./Library/RobloxHelper.js');
const CommunityCommands = require('./Library/FrontierManagerCommands/commands');
const CompanyCommands = require('./Library/HudsonManagerCommands/commands');

const db = new Database();
db.connect();

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

// Joins & Leaves
CompanyClient.on('guildMemberAdd', member => {
    member.roles.add([
        DiscordHelper.getRoleIdFromName(member.guild, 'Unverified'),
        '920797533868032091', // Buffer
        '921540428782780486', // Buffer
        DiscordHelper.getRoleIdFromName(member.guild, 'Awaiting Placement'), // Awaiting Placement
    ]);
})

CommunityClient.on('guildMemberAdd', member => {
    member.roles.add([
        DiscordHelper.getRoleIdFromName(member.guild, 'Unverified')
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

// Reaction Roles
const reactionMessageId = "817110322681872434";
const colonistRoleId  = '817103889374904380';
const nativeRoleId    = '817104033524219904';
const hbcRoleId       = '817104057780011058';

CommunityClient.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot || !reaction.message.guild) return;

    if (reaction.message.id == reactionMessageId) {
        const member = reaction.message.guild.members.cache.get(user.id);
        if (reaction.emoji.identifier == '%F0%9F%87%A8%F0%9F%87%A6') {
            member.roles.add([colonistRoleId]);
        } else if (reaction.emoji.name === '🦅') {
            member.roles.add([nativeRoleId]);
        } else if (reaction.emoji.id == '817118890483253329' || DiscordHelper.isVerified(member)) {
            const userId = await RobloxHelper.getUserIdFromDiscordId(user.id)
            const groupRank = await RobloxHelper.getRankInGroup(userId, process.env.HBC_GROUP_ID)
            if (groupRank > 1) {
                member.roles.add([hbcRoleId]);
            }
        }
    }
});

CommunityClient.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot || !reaction.message.guild) return;

    if (reaction.message.id == reactionMessageId) {
        const member = reaction.message.guild.members.cache.get(user.id);
        if (reaction.emoji.identifier == '%F0%9F%87%A8%F0%9F%87%A6') {
            member.roles.remove([colonistRoleId]);
        } else if (reaction.emoji.name === '🦅') {
            member.roles.remove([nativeRoleId]);
        } else if (reaction.emoji.id == '817118890483253329' || DiscordHelper.isVerified(member)) {
            member.roles.remove([hbcRoleId])
        }
    }
});

// Message Create
const messageCreateCallback = async message => {
    if (!message.guild || message.author.id == message.guild.ownerId || message.author.bot) return;

    if (message.channel.name == "verification") {
        try { message.delete() } catch { err => console.log(err) }
    }
}
CompanyClient.on('messageCreate', messageCreateCallback)
CommunityClient.on('messageCreate', messageCreateCallback)

// Interaction Create
CommunityClient.on('interactionCreate', async interaction => {
    if (!interaction.isCommand) return;
    
    if (CommunityCommands[interaction.commandName]) {
        CommunityCommands[interaction.commandName].run(interaction, CommunityClient)
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

// Bots Ready
CommunityClient.on('ready', async () => {
    console.log(`Logged in as ${CommunityClient.user.tag}`);

    const guild = CommunityClient.guilds.cache.get('805853313643577344');
    let commands = guild.commands

    for (const cmd in CommunityCommands) {
        commands?.create(CommunityCommands[cmd].info)
    }

    // Cache reaction message
    CommunityClient.channels.cache.get('817105824224641097').messages.fetch(reactionMessageId)
});

CompanyClient.on('ready', async () => {
    console.log(`Logged in as ${CompanyClient.user.tag}`);

    const guild = CompanyClient.guilds.cache.get('809854975446351942');
    let commands = guild.commands

    for (const cmd in CompanyCommands) {
        commands?.create(CompanyCommands[cmd].info)
    }
});

CommunityClient.login(process.env.COMMUNITY_MANAGER_TOKEN);
CompanyClient.login(process.env.HUDSON_MANAGER_TOKEN);