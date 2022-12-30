require('dotenv').config();
const Discord = require('discord.js');
const RobloxHelper = require('./RobloxHelper');

const promptEmbed = (description, includeQuestionMark) => {
    return new Discord.MessageEmbed()
        .setColor("BLUE")
        .setTitle("Prompt")
        .setDescription((includeQuestionMark ? "❓ " : "") + description)
        .setFooter("This prompt will cancel after 200 seconds.")
        .setTimestamp()
}

const successEmbed = (title, description) => {
    return new Discord.MessageEmbed()
        .setColor("GREEN")
        .setTitle(title)
        .setDescription(`✅ ${description}`)
        .setTimestamp()
}

const failureEmbed = (title, description) => {
    return new Discord.MessageEmbed()
        .setColor("RED")
        .setTitle(title)
        .setDescription(`❌ ${description}`)
        .setTimestamp()
}

const loadingEmbed = (title, description) => {
    return new Discord.MessageEmbed()
        .setColor("GREY")
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
        Utility : 'GREY',
        Reimbursement : 'GREEN',
        Moderation : 'YELLOW',
        Administration : 'RED'
    }[cmdType]
    await (await guild.channels.cache.get('914515512568983563')).send({embeds : [new Discord.MessageEmbed()
        .setColor(colour)
        .setTitle(`${cmd} was used`)
        .addFields(fields)
        .setFooter(authorUsername)
        .setTimestamp()
    ], files : file == undefined ? [] : [file]})
}

const getMemberFromMention = async (msg) => {
	const matches = msg.content.match(Discord.MessageMentions.USERS_PATTERN);
	if (!matches) return;
	return (await msg.guild.members.fetch()).get(matches[0].replace('<@!', '').replace('>', ''));
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

module.exports = { loadingEmbed, failureEmbed, successEmbed, promptEmbed, logCommand, getMemberFromMention, authenticate };