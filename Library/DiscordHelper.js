require('dotenv').config();
const Discord = require('discord.js');
const RobloxHelper = require('./RobloxHelper');

const promptEmbed = (description, includeQuestionMark) => {
    return new Discord.EmbedBuilder()
        .setColor(Discord.Colors.Blue)
        .setTitle("Prompt")
        .setDescription((includeQuestionMark ? "❓ " : "") + description)
        .setFooter({"text": "This prompt will cancel after 200 seconds."})
        .setTimestamp()
}

const successEmbed = (title, description) => {
    return new Discord.EmbedBuilder()
        .setColor(Discord.Colors.Green)
        .setTitle(title)
        .setDescription(`✅ ${description}`)
        .setTimestamp()
}

const failureEmbed = (title, description) => {
    return new Discord.EmbedBuilder()
        .setColor(Discord.Colors.Red)
        .setTitle(title)
        .setDescription(`❌ ${description}`)
        .setTimestamp()
}

const loadingEmbed = (title, description) => {
    return new Discord.EmbedBuilder()
        .setColor(Discord.Colors.Grey)
        .setTitle(title)
        .setDescription(`🦧 ${description}`)
        .setTimestamp()
}

const logCommand = async (guild, cmd, cmdType, authorUsername, args, reason, file) => {
    let fields = [];
    for (const [key, value] of Object.entries(args)) {
        fields.push({ 'name': `${key}`, 'value': `${value}` })
    }
    fields.push({ 'name' : 'Reason', 'value' : `> ${reason}`})
    const colour = {
        Utility : Discord.Colors.Grey,
        Reimbursement : Discord.Colors.Green,
        Moderation : Discord.Colors.Yellow,
        Administration : Discord.Colors.Red
    }[cmdType]
    await (await guild.channels.cache.get('914515512568983563')).send({embeds : [new Discord.EmbedBuilder()
        .setColor(colour)
        .setTitle(`${cmd} was used`)
        .addFields(fields)
        .setFooter({"text": authorUsername})
        .setTimestamp()
    ], files : file == undefined ? [] : [file]})
}

const isVerified = async (member) => {
    return member.roles.cache.has( getRoleIdFromName(member.guild, 'Verified') )
}

const getMemberFromMention = async (msg) => {
	const matches = msg.content.match(Discord.MessageMentions.USERS_PATTERN);
	if (!matches) return;
	return (await msg.guild.members.fetch()).get(matches[0].replace('<@!', '').replace('>', ''));
}

const getMemberFromRobloxUserId = async (userId, guild) => {
    return (await guild.members.cache.get(await RobloxHelper.getDiscordIdFromUserId(userId)))
}

const authenticate = async (userId, permissionLevel) => {
    if (permissionLevel == 'All') return true;
    const groupRank = await RobloxHelper.getRankInGroup(userId, process.env.COMMUNITY_GROUP_ID);
    switch (permissionLevel) {
        case 'Discord Moderator' : return (groupRank >= 225 && groupRank != 245);
        case 'Moderator' : return (groupRank >= 230 && groupRank != 245);
        case 'Administrator' : return (groupRank >= 240 && groupRank != 245);
    }
}

const getRoleIdFromName = ((guild, name) => {
    let id = 0
    guild.roles.cache.forEach((role, roleId) => {
        if (role.name == name) {
            id = roleId
        }
    });
    return id;
})

module.exports = { loadingEmbed, failureEmbed, successEmbed, promptEmbed, logCommand, getMemberFromMention, authenticate, getRoleIdFromName, getMemberFromRobloxUserId, isVerified };