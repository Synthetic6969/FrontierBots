const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');

module.exports = {
    info : {
        name : 'discharge',
        description : 'Discharge a member of the Company.',
        options : [
            {
                name : 'username',
                description : 'Target\'s Roblox username.',
                type : 3,
                required : true
            },
            {
                name : 'dishonourable',
                description : 'Is the discharge dishonourable?',
                type : 5,
                required : true
            },
            {
                name : 'reason',
                description : 'Reason for discharge [ PROVIDE EVIDENCE ].',
                type : 3,
                required : true
            }
        ]
    },

    run : async (interaction, client) => {
        const targetUsername = interaction.options.getString('username');
        const dishonourable = interaction.options.getBoolean('dishonourable');
        const reason = interaction.options.getString('reason');

        await interaction.deferReply({embeds : [DiscordHelper.loadingEmbed('Validating Request', 'Checking parameters...')], ephemeral : true})

        // Authenticate user
        const authorUserId = await RobloxHelper.getUserIdFromDiscordId(interaction.member.id);
        if (!authorUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Discharge Failed', `You are not verified.`)], ephemeral : true});
            return;
        }
        const authorUsername = await RobloxHelper.getUsernameFromUserId(authorUserId);
        const authorRank = await RobloxHelper.getRankInGroup(authorUserId, process.env.HBC_GROUP_ID)
        if (authorRank < 45) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Discharge Failed', `Insufficient permissions. You must be at least lieutenant.`)], ephemeral : true});
            return;
        }

        // Check target
        const targetUserId = await RobloxHelper.getUserIdFromName(targetUsername);
        const targetRank = await RobloxHelper.getRankInGroup(targetUserId, process.env.HBC_GROUP_ID);
        if (targetRank <= 1) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Discharge Failed', `User is not a member of the company.`)], ephemeral : true});
            return;
        } if (targetRank >= authorRank) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Discharge Failed', `You are not permitted to rank people equal to or above your rank.`)], ephemeral : true});
            return;
        }
        const targetMember = await DiscordHelper.getMemberFromRobloxUserId(targetUserId, interaction.guild)

        // Discharge from ROBLOX
        interaction.guild.channels.cache.get(dishonourable ? '920693836903231489' : '917074761304137749').send({embeds : [
            new Discord.EmbedBuilder()
                .setTitle(dishonourable ? `Dishonourable Discharge` : `General Discharge`)
                .addFields([
                    {"name": "Discharged Soldier", "value": `> **ROBLOX:** [${targetUsername}](https://www.roblox.com/profile/${targetUserId})\n> **Discord:** ${targetMember ? `<@${targetMember.user.id}>` : "Discord not found"}\n> **Company:** ${targetMember?.nickname ? `${targetMember.nickname.split(" ")[0].split(" ")[0].replace(/\[/g, '[ ').replace(/\]/g, ' ]')}` : "Could not find."}`},
                    {"name": "Reason", "value": `> ${reason}`},
                    {"name": "Discharging Officer", "value": `> <@${interaction.member.id}>`}
                ])
                .setFooter({'text': `Appeals may be made to the Judge Advocate Corps.`})
                .setTimestamp()
        ]})
        RobloxHelper.setRank(targetUserId, process.env.HBC_GROUP_ID, 'Awaiting Placement')

        // Discharge from Discord
        if (targetMember) {
            targetMember.setNickname(null)
            await targetMember.roles.remove(targetMember._roles)
            targetMember.roles.add([
                '918682053657100340', // Unverified
                '920797533868032091', // Buffer
                '921540428782780486', // Buffer
                '810249114612531200', // Settler
            ]);
        }

        interaction.editReply({embeds : [DiscordHelper.successEmbed('Discharge Success', `${targetUsername} has been discharged. If this was a mistake, correct it immediately or there will be very serious repercussions.`)], ephemeral : true});
    }
}