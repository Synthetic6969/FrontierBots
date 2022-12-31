const Discord       = require('discord.js');
const RobloxHelper  = require('../RobloxHelper');
const DiscordHelper = require('../DiscordHelper');

module.exports = {
    info : {
        name : 'warn',
        description : 'Warn a player.',
        options : [
            {
                name : 'username',
                description : 'Target username.',
                type : 3,
                required : true
            },
            {
                name : 'reason',
                description : 'Reason for ban.',
                type : 3,
                required : true
            }
        ]
    },

    run : async interaction => {
        const username = interaction.options.getString('username');
        const reason = interaction.options.getString('reason');

        await interaction.deferReply({embeds : [DiscordHelper.loadingEmbed('Validating Request', 'Checking parameters...')], ephemeral : true})

        // Authenticate user
        const authorUserId = await RobloxHelper.getUserIdFromDiscordId(interaction.member.id);
        if (!authorUserId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Unban Failed', `You are not verified with Bloxlink.`)], ephemeral : true});
            return;
        }
        const authorUsername = await RobloxHelper.getUsernameFromUserId(authorUserId);
        if (!(await DiscordHelper.authenticate(authorUserId, 'Administrator'))) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Unban Failed', `Insufficient permissions.`)], ephemeral : true});
            return;
        }

        // Validate arguments
        const userId = await RobloxHelper.getUserIdFromName(username);
        if (!userId) {
            interaction.editReply({embeds : [DiscordHelper.failureEmbed('Unban Failed', `Invalid username provided.`)], ephemeral : true});
            return;
        }

        let data = (await RobloxHelper.getAsync('players_ds', `${userId}`, 'warnings'))
        data = (data == undefined ? 0 : data)

        // Success
        interaction.editReply({'embeds' : [ DiscordHelper.successEmbed('Success', `Successfully unbanned ${username}`) ], components : [], ephemeral : true})
        DiscordHelper.logCommand(interaction.guild, 'unban', 'Administration', authorUsername, { Target : username }, reason)
        
        // Add probation
        RobloxHelper.setAsync('players_ds', `${userId}`, 'warnings', data + 1)
    }
}