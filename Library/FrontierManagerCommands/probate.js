const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');

module.exports = {
    info : {
        name : 'probate',
        description : 'Put a discord member onto probation.',
        options : [
            {
                name : 'user',
                description : 'Discord mention of the target user.',
                type : 9,
                required : true
            },
            {
                name : 'time',
                description : 'Number of hours for probation (1 - 168).',
                type : 4,
                required : true
            },
            {
                name : 'reason',
                description : 'Reason of probation.',
                type : 3,
                required : true
            }
        ]
    },

    run : async interaction => {
        const member = interaction.options.getMentionable('user');
        const time = interaction.options.getInteger('time');
        const reason = interaction.options.getString('reason');

        await interaction.deferReply({embeds : [DiscordHelper.loadingEmbed('Validating Request', 'Checking parameters...')], ephemeral : true})

        // Authenticate user
        const authorUserId = await RobloxHelper.getUserIdFromDiscordId(interaction.member.id);
        if (!authorUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Probate Failed', `You are not verified with Bloxlink.`)], ephemeral : true});
            return;
        }
        const authorUsername = await RobloxHelper.getUsernameFromUserId(authorUserId);
        if (!(await DiscordHelper.authenticate(authorUserId, 'Discord Moderator'))) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Probate Failed', `Insufficient permissions.`)], ephemeral : true});
            return;
        }

        // Success
        interaction.editReply({'embeds' : [ DiscordHelper.successEmbed('Success', `Successfully probated ${member} for ${time} hours`) ], components : [], ephemeral : true})
        DiscordHelper.logCommand(interaction.guild, 'probate', 'Moderation', authorUsername, { Target : member, Time : `${time} hours` }, reason)
        
        // Add probation
        member.roles.add('817124981166833664')
        try {
            member.user.send({'embeds' : [ DiscordHelper.failureEmbed('You have been probated', `${authorUsername} probated you for ${Math.floor(Number(time))} hours.\nOnce this time is up, you may contact a member of staff to get unprobated.`) ]})
        } catch (err) {}

        // Remove probation
        setTimeout(() => {
            member.roles.remove('817124981166833664')
        }, 60000*60*time)
    }
}